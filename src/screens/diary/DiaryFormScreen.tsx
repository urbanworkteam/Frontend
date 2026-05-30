import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

// DateTimePicker는 native-only 모듈. 웹에서는 import 자체가 native 모듈을 찾으려다 throw.
type DateTimePickerComponent =
  typeof import('@react-native-community/datetimepicker').default;
const DateTimePicker: DateTimePickerComponent | null =
  Platform.OS !== 'web'
    ? require('@react-native-community/datetimepicker').default
    : null;
import { useCrops } from '@/api/crop';
import { useFarmLocations } from '@/api/farmLocation';
import { useWeather } from '@/api/weather';
import { useUpdateDiary, useWorkTypes, useWriteDiary } from '@/api/diary';
import { extOf, uploadToS3, usePresign } from '@/api/upload';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { Modal } from '@/ui/components/Modal';
import { colors, radius, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';
import { DiaryResponse } from '@/types/diary';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];
function formatKoreanDate(s: string): string {
  const d = parseDate(s);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${KOR_DOW[d.getDay()]}요일`;
}

function urlToKey(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return url;
  }
}

type PhotoSlot = { key: string; previewUrl?: string };
type Source = 'AUTO' | 'MANUAL';

export type DiaryFormProps = {
  mode: 'create' | 'edit';
  diaryId?: number;
  initialDate?: string;
  initialData?: DiaryResponse;
  onDelete?: () => void;
};

export function DiaryFormScreen({ mode, diaryId, initialDate, initialData, onDelete }: DiaryFormProps) {
  const isEdit = mode === 'edit';

  const [date, setDate] = useState(initialData?.date ?? initialDate ?? todayStr());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [farmLocationId, setFarmLocationId] = useState<number | null>(
    initialData?.farmLocation?.id ?? null,
  );
  const [cropId, setCropId] = useState<number | null>(initialData?.crop?.id ?? null);
  const initialSource = (initialData?.weather?.source as Source | 'KMA' | undefined) ?? 'AUTO';
  const [source, setSource] = useState<Source>(initialSource === 'MANUAL' ? 'MANUAL' : 'AUTO');
  // 수동 입력 모드용 날씨 필드. AUTO 일 때는 useWeather 응답이 채워짐.
  const [manualMain, setManualMain] = useState<string>(initialData?.weather?.main ?? '');
  const [manualTempMax, setManualTempMax] = useState<string>(
    initialData?.weather?.tempMax != null ? String(initialData.weather.tempMax) : '',
  );
  const [manualTempMin, setManualTempMin] = useState<string>(
    initialData?.weather?.tempMin != null ? String(initialData.weather.tempMin) : '',
  );
  const [manualPrecip, setManualPrecip] = useState<string>(
    initialData?.weather?.precipitationMm != null
      ? String(initialData.weather.precipitationMm)
      : '',
  );
  const [manualHumidity, setManualHumidity] = useState<string>(
    initialData?.weather?.humidityPct != null ? String(initialData.weather.humidityPct) : '',
  );
  const [memo, setMemo] = useState<string>(initialData?.memo ?? '');
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    initialData?.photos.map((p) => ({ key: urlToKey(p.url), previewUrl: p.url })) ?? [],
  );
  const [workBlocks, setWorkBlocks] = useState<{ workType: string; detail: string }[]>(
    initialData?.workBlocks.map((b) => ({ workType: b.workType, detail: b.detail ?? '' })) ?? [],
  );
  const [showSheet, setShowSheet] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const locations = useFarmLocations();
  const crops = useCrops();
  const types = useWorkTypes();
  const weather = useWeather(farmLocationId, date, source === 'AUTO');
  const presign = usePresign();
  const write = useWriteDiary();
  const update = useUpdateDiary();
  const isPending = isEdit ? update.isPending : write.isPending;

  useEffect(() => {
    if (isEdit) return;
    if (locations.data?.length && farmLocationId === null) setFarmLocationId(locations.data[0].id);
  }, [locations.data, farmLocationId, isEdit]);
  useEffect(() => {
    if (isEdit) return;
    if (crops.data?.length && cropId === null) setCropId(crops.data[0].id);
  }, [crops.data, cropId, isEdit]);

  const w = weather.data;
  const canSubmit =
    !!farmLocationId && !!cropId && !!date && workBlocks.length > 0 && !isPending;

  const buildBody = () => ({
    date,
    farmLocationId: farmLocationId!,
    cropId: cropId!,
    weather:
      source === 'AUTO'
        ? { source: 'AUTO' as const }
        : {
            source: 'MANUAL' as const,
            main: manualMain.trim() || null,
            tempMax: manualTempMax.trim() ? Number(manualTempMax) : null,
            tempMin: manualTempMin.trim() ? Number(manualTempMin) : null,
            precipitationMm: manualPrecip.trim() ? Number(manualPrecip) : null,
            humidityPct: manualHumidity.trim() ? Math.round(Number(manualHumidity)) : null,
          },
    workBlocks: workBlocks.map((b) => ({ workType: b.workType, detail: b.detail || null })),
    memo: memo || null,
    photoKeys: photos.map((p) => p.key),
  });

  const handleSubmitError = (e: unknown) => {
    const err = e as { code?: string; message?: string };
    if (err.code === 'DIARY_ALREADY_EXISTS_FOR_DATE') setDuplicateOpen(true);
    else toast.error(err.message ?? '저장에 실패했어요');
  };

  const submit = () => {
    if (!canSubmit) return;
    if (isEdit) {
      update.mutate(
        { id: diaryId!, body: buildBody() },
        {
          onSuccess: () => {
            toast.success('일지를 수정했어요');
            router.back();
          },
          onError: handleSubmitError,
        },
      );
    } else {
      write.mutate(buildBody(), {
        onSuccess: (created) => {
          router.replace({
            pathname: '/(tabs)/diary/write-complete',
            params: { id: String(created.id), date: created.date },
          });
        },
        onError: handleSubmitError,
      });
    }
  };

  const onDateChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);
    }
  };

  const pickPhoto = async () => {
    if (photos.length >= 5) {
      toast.info('최대 5장까지 첨부할 수 있어요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, selectionLimit: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      toast.error('10MB 이하 이미지만 첨부 가능합니다');
      return;
    }
    try {
      const ps = await presign.mutateAsync({
        kind: 'DIARY',
        ext: extOf(asset.uri),
        sizeBytes: asset.fileSize ?? 0,
      });
      const blob = await (await fetch(asset.uri)).blob();
      await uploadToS3(ps.uploadUrl, blob, asset.mimeType ?? 'image/jpeg');
      setPhotos((s) => [...s, { key: ps.key, previewUrl: ps.publicUrl ?? asset.uri }]);
    } catch (err) {
      toast.error('사진 업로드에 실패했어요');
    }
  };

  const removePhoto = (key: string) => setPhotos((s) => s.filter((p) => p.key !== key));

  const confirmWorkTypes = (codes: string[]) => {
    setWorkBlocks((s) => {
      const existing = new Set(s.map((b) => b.workType));
      const additions = codes
        .filter((c) => !existing.has(c))
        .map((c) => ({ workType: c, detail: '' }));
      return [...s, ...additions];
    });
    setShowSheet(false);
  };
  const updateBlockDetail = (i: number, detail: string) =>
    setWorkBlocks((s) => s.map((b, idx) => (idx === i ? { ...b, detail } : b)));
  const removeBlock = (i: number) => setWorkBlocks((s) => s.filter((_, idx) => idx !== i));

  const displayWeather = w ?? (initialData?.weather ? initialData.weather : null);
  const workTypeLabel = (code: string) => types.data?.find((t) => t.code === code)?.label ?? code;
  const workTypeIcon = (code: string) => types.data?.find((t) => t.code === code)?.icon ?? '·';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← 취소</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? '일지 편집' : '일지 작성'}</Text>
        <View style={styles.headerRight}>
          {isEdit && onDelete ? (
            <Pressable onPress={onDelete} hitSlop={12} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>삭제</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={submit} disabled={!canSubmit} hitSlop={12}>
            <Text style={[styles.submit, !canSubmit && { color: colors.textTertiary }]}>완료</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
        >
          <Field label="날짜 *">
            {Platform.OS === 'web' ? (
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                hint={formatKoreanDate(date)}
              />
            ) : (
              <>
                <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateField}>
                  <Text style={styles.dateText}>{formatKoreanDate(date)}</Text>
                  <Text style={styles.dateChevron}>›</Text>
                </Pressable>
                {showDatePicker && DateTimePicker ? (
                  <DateTimePicker
                    value={parseDate(date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                  />
                ) : null}
              </>
            )}
          </Field>

          <Field label="농장 위치">
            <ChipRow
              items={locations.data ?? []}
              selectedId={farmLocationId}
              onSelect={(id) => setFarmLocationId(id)}
              labelOf={(l) => l.label}
            />
          </Field>

          <Field label="날씨">
            <View style={styles.weatherCard}>
              <View style={styles.weatherCardTopRow}>
                <Text style={styles.weatherIcon}>☀️</Text>
                <View style={{ flex: 1, marginLeft: space.sm }}>
                  {source === 'AUTO' && displayWeather ? (
                    <>
                      <Text style={styles.weatherMain}>
                        {displayWeather.main ?? '-'} · 최고 {displayWeather.tempMax ?? '-'}° 최저{' '}
                        {displayWeather.tempMin ?? '-'}°
                      </Text>
                      <Text style={styles.weatherSub}>
                        강수량 {displayWeather.precipitationMm ?? 0}mm · 습도{' '}
                        {displayWeather.humidityPct ?? '-'}%
                      </Text>
                    </>
                  ) : source === 'AUTO' ? (
                    <Text style={styles.weatherSub}>날씨 정보 불러오는 중...</Text>
                  ) : (
                    <Text style={styles.weatherSub}>아래에 직접 입력해주세요</Text>
                  )}
                </View>
                {source === 'AUTO' && weather.isFetching ? <ActivityIndicator /> : null}
                <Pressable
                  style={[
                    styles.sourceBadge,
                    source === 'AUTO' ? styles.sourceBadgeAuto : styles.sourceBadgeManual,
                  ]}
                  onPress={() => setSource(source === 'AUTO' ? 'MANUAL' : 'AUTO')}
                >
                  <Text style={styles.sourceBadgeText}>
                    {source === 'AUTO' ? '자동 입력' : '✎ 수동 입력'}
                  </Text>
                </Pressable>
              </View>

              {source === 'MANUAL' ? (
                <View style={styles.weatherManualBox}>
                  <TextInput
                    label="날씨 한 줄"
                    value={manualMain}
                    onChangeText={setManualMain}
                    placeholder="맑음 / 흐림 / 비"
                    maxLength={20}
                  />
                  <View style={styles.weatherManualRow}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        label="최고 (°C)"
                        value={manualTempMax}
                        onChangeText={setManualTempMax}
                        placeholder="24"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        label="최저 (°C)"
                        value={manualTempMin}
                        onChangeText={setManualTempMin}
                        placeholder="12"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.weatherManualRow}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        label="강수량 (mm)"
                        value={manualPrecip}
                        onChangeText={setManualPrecip}
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        label="습도 (%)"
                        value={manualHumidity}
                        onChangeText={setManualHumidity}
                        placeholder="45"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </Field>

          <Field label="작물 *">
            <ChipRow
              items={crops.data ?? []}
              selectedId={cropId}
              onSelect={(id) => setCropId(id)}
              labelOf={(c) => c.name}
              colorOf={(c) => c.colorHex}
            />
            <Pressable onPress={() => router.push('/(tabs)/mypage/crops')} hitSlop={4}>
              <Text style={styles.helperLink}>
                {(crops.data?.length ?? 0) === 0
                  ? '+ 작물을 먼저 등록해주세요 (마이페이지 → 재배 작물 관리)'
                  : '+ 다른 작물 추가하기 (마이페이지)'}
              </Text>
            </Pressable>
          </Field>

          <Field label={`작업 내용 * (${workBlocks.length})`}>
            {workBlocks.map((b, i) => (
              <View key={`${b.workType}-${i}`} style={styles.block}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockIcon}>{workTypeIcon(b.workType)}</Text>
                  <Text style={styles.blockType}>{workTypeLabel(b.workType)}</Text>
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={() => removeBlock(i)} hitSlop={8} style={styles.blockRemoveBtn}>
                    <Text style={styles.blockRemove}>×</Text>
                  </Pressable>
                </View>
                <TextInput
                  value={b.detail}
                  onChangeText={(v) => updateBlockDetail(i, v)}
                  placeholder="작업 상세 (예: 점적관수 30분)"
                  maxLength={500}
                  multiline
                />
              </View>
            ))}
            <Button
              label="+ 작업 블록 추가"
              variant="secondary"
              onPress={() => setShowSheet(true)}
              fullWidth
            />
          </Field>

          <Field label="메모">
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="오늘의 메모..."
              multiline
              maxLength={2000}
            />
          </Field>

          <Field label={`사진 (최대 5장)`}>
            <View style={styles.photoGrid}>
              {photos.map((p) => (
                <View key={p.key} style={styles.photoThumb}>
                  {p.previewUrl ? (
                    <Image source={{ uri: p.previewUrl }} style={styles.photoImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.photoImage, styles.photoFallback]}>
                      <Text style={styles.photoFallbackIcon}>🖼️</Text>
                    </View>
                  )}
                  <Pressable style={styles.photoRemoveBtn} onPress={() => removePhoto(p.key)} hitSlop={4}>
                    <Text style={styles.photoRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < 5 ? (
                <Pressable
                  style={styles.photoAdd}
                  onPress={pickPhoto}
                  disabled={presign.isPending}
                >
                  {presign.isPending ? (
                    <ActivityIndicator color={colors.textSecondary} />
                  ) : (
                    <>
                      <Text style={styles.photoAddIcon}>+</Text>
                      <Text style={styles.photoAddText}>추가</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          </Field>

          <View style={{ marginTop: space.lg }}>
            <Button
              label={isPending ? '저장 중...' : isEdit ? '✓ 수정 완료' : '✓ 작성 완료'}
              onPress={submit}
              disabled={!canSubmit}
              loading={isPending}
              variant="secondary"
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <WorkTypeSheet
        visible={showSheet}
        types={types.data ?? []}
        existing={workBlocks.map((b) => b.workType)}
        onConfirm={confirmWorkTypes}
        onClose={() => setShowSheet(false)}
      />

      <Modal
        visible={duplicateOpen}
        title="이미 일지가 있어요"
        message="해당 농장의 같은 날짜에 일지가 이미 존재합니다. 일지 목록에서 편집해주세요."
        onClose={() => {
          setDuplicateOpen(false);
          router.replace('/(tabs)/diary');
        }}
      />
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={{ gap: space.sm }}>{children}</View>
    </View>
  );
}

function ChipRow<T extends { id: number }>({
  items,
  selectedId,
  onSelect,
  labelOf,
  colorOf,
}: {
  items: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  labelOf: (item: T) => string;
  colorOf?: (item: T) => string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.xs }}
    >
      {items.map((it) => {
        const sel = it.id === selectedId;
        const color = colorOf?.(it);
        return (
          <Pressable
            key={it.id}
            onPress={() => onSelect(it.id)}
            style={[
              chipStyles.chip,
              sel && chipStyles.chipSel,
              color && { borderColor: color },
              color && sel && { backgroundColor: color },
            ]}
          >
            <Text style={[chipStyles.text, sel && chipStyles.textSel]}>{labelOf(it)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function WorkTypeSheet({
  visible,
  types,
  existing,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  types: { code: string; label: string; icon: string }[];
  existing: string[];
  onConfirm: (codes: string[]) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setPicked([]);
  }, [visible]);

  const toggle = (code: string) =>
    setPicked((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));

  return (
    <Modal
      visible={visible}
      title="오늘 한 작업을 선택하세요"
      onClose={onClose}
      onConfirm={picked.length > 0 ? () => onConfirm(picked) : undefined}
      confirmLabel={picked.length > 0 ? `선택 완료 (${picked.length})` : '취소'}
      cancelLabel="취소"
    >
      <View style={{ gap: space.sm, marginVertical: space.md }}>
        {types.length === 0 ? (
          <View style={sheetStyles.emptyBox}>
            <Text style={sheetStyles.emptyText}>
              작업 유형을 불러오지 못했어요.{'\n'}네트워크 또는 로그인 상태를 확인하고 다시 시도해주세요.
            </Text>
          </View>
        ) : null}
        {types.map((t) => {
          const sel = picked.includes(t.code);
          const already = existing.includes(t.code);
          return (
            <Pressable
              key={t.code}
              style={[sheetStyles.row, sel && sheetStyles.rowSel, already && sheetStyles.rowDisabled]}
              onPress={() => !already && toggle(t.code)}
              disabled={already}
            >
              <Text style={{ fontSize: 22 }}>{t.icon}</Text>
              <Text style={[sheetStyles.label, already && { color: colors.textTertiary }]}>
                {t.label}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={[sheetStyles.check, sel && { color: colors.primary }]}>
                {already ? '추가됨' : sel ? '✓' : ''}
              </Text>
            </Pressable>
          );
        })}
        {picked.length > 0 ? (
          <View style={sheetStyles.pickedRow}>
            {picked.map((c) => {
              const t = types.find((x) => x.code === c);
              return (
                <View key={c} style={sheetStyles.pickedChip}>
                  <Text style={sheetStyles.pickedChipText}>✓ {t?.label ?? c}</Text>
                  <Pressable onPress={() => toggle(c)} hitSlop={4}>
                    <Text style={sheetStyles.pickedChipX}>×</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: { ...typography.body, color: colors.textSecondary },
  headerTitle: { ...typography.title, color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  deleteBtn: { paddingVertical: space.xs },
  deleteText: { ...typography.bodyBold, color: colors.danger },
  submit: { ...typography.bodyBold, color: colors.primary },

  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  dateText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  dateChevron: { fontSize: 22, color: colors.textTertiary },

  weatherCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
  },
  weatherCardTopRow: { flexDirection: 'row', alignItems: 'center' },
  weatherIcon: { fontSize: 24 },
  weatherMain: { ...typography.bodyBold, color: colors.textPrimary },
  weatherSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sourceBadge: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
  },
  sourceBadgeAuto: { backgroundColor: '#E6F4EA' },
  sourceBadgeManual: { backgroundColor: colors.surfaceMuted },
  sourceBadgeText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  block: {
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.xs,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  blockIcon: { fontSize: 18 },
  blockType: { ...typography.bodyBold, color: colors.textPrimary },
  blockRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockRemove: { fontSize: 18, color: colors.textTertiary, lineHeight: 18 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  photoThumb: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceMuted,
  },
  photoImage: { width: '100%', height: '100%' },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoFallbackIcon: { fontSize: 28 },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, lineHeight: 14, fontWeight: '700' },
  photoAdd: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  photoAddIcon: { fontSize: 28, color: colors.textSecondary, lineHeight: 32 },
  photoAddText: { ...typography.caption, color: colors.textSecondary },

  weatherManualBox: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.sm,
  },
  weatherManualRow: { flexDirection: 'row', gap: space.sm },
  helperLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: space.xs,
  },
});

const fieldStyles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { ...typography.body, color: colors.textPrimary },
  textSel: { color: '#fff' },
});

const sheetStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  rowSel: { backgroundColor: '#E6F4EA', borderColor: colors.primary },
  rowDisabled: { opacity: 0.5 },
  label: { ...typography.body, color: colors.textPrimary },
  check: { ...typography.bodyBold, color: colors.textTertiary, minWidth: 24, textAlign: 'right' },
  pickedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  pickedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
  },
  pickedChipText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  pickedChipX: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  emptyBox: {
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
