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
import { useCrops } from '@/api/crop';
import { useFarmLocations } from '@/api/farmLocation';
import { useWeather } from '@/api/weather';
import { useUpdateDiary, useWorkTypes, useWriteDiary } from '@/api/diary';
import { extOf, uploadToS3, usePresign } from '@/api/upload';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { Modal } from '@/ui/components/Modal';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';
import { DiaryResponse } from '@/types/diary';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Backend returns the photo as a full CDN URL; PATCH expects the S3 key.
// We recover the key from the URL pathname so existing photos survive an edit.
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
  const [farmLocationId, setFarmLocationId] = useState<number | null>(
    initialData?.farmLocation?.id ?? null,
  );
  const [cropId, setCropId] = useState<number | null>(initialData?.crop?.id ?? null);
  const initialSource = (initialData?.weather?.source as Source | 'KMA' | undefined) ?? 'AUTO';
  const [source, setSource] = useState<Source>(initialSource === 'MANUAL' ? 'MANUAL' : 'AUTO');
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
            main: w?.main ?? initialData?.weather?.main ?? null,
            tempMax: w?.tempMax ?? initialData?.weather?.tempMax ?? null,
            tempMin: w?.tempMin ?? initialData?.weather?.tempMin ?? null,
            precipitationMm:
              w?.precipitationMm ?? initialData?.weather?.precipitationMm ?? null,
            humidityPct: w?.humidityPct ?? initialData?.weather?.humidityPct ?? null,
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
          toast.success('일지를 저장했어요');
          router.replace({ pathname: '/(tabs)/diary/[id]', params: { id: String(created.id) } });
        },
        onError: handleSubmitError,
      });
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
      setPhotos((s) => [...s, { key: ps.key, previewUrl: ps.publicUrl }]);
    } catch (err) {
      toast.error('사진 업로드에 실패했어요');
    }
  };

  const removePhoto = (key: string) => setPhotos((s) => s.filter((p) => p.key !== key));
  const addBlock = (workType: string) => {
    setWorkBlocks((s) => [...s, { workType, detail: '' }]);
    setShowSheet(false);
  };
  const updateBlockDetail = (i: number, detail: string) =>
    setWorkBlocks((s) => s.map((b, idx) => (idx === i ? { ...b, detail } : b)));
  const removeBlock = (i: number) => setWorkBlocks((s) => s.filter((_, idx) => idx !== i));

  const displayWeather = w ?? (initialData?.weather ? initialData.weather : null);

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
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
          <Field label="날짜">
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
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
            <View style={styles.weatherRow}>
              <Pressable
                style={[styles.toggle, source === 'AUTO' && styles.toggleActive]}
                onPress={() => setSource('AUTO')}
              >
                <Text style={[styles.toggleText, source === 'AUTO' && styles.toggleTextActive]}>
                  자동
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggle, source === 'MANUAL' && styles.toggleActive]}
                onPress={() => setSource('MANUAL')}
              >
                <Text style={[styles.toggleText, source === 'MANUAL' && styles.toggleTextActive]}>
                  수동
                </Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              {weather.isFetching ? <ActivityIndicator /> : null}
            </View>
            {displayWeather ? (
              <Text style={styles.weatherText}>
                {displayWeather.main ?? '-'} · {displayWeather.tempMin ?? '-'}~
                {displayWeather.tempMax ?? '-'}℃ · 강수 {displayWeather.precipitationMm ?? 0}mm
              </Text>
            ) : null}
          </Field>

          <Field label="작물">
            <ChipRow
              items={crops.data ?? []}
              selectedId={cropId}
              onSelect={(id) => setCropId(id)}
              labelOf={(c) => c.name}
              colorOf={(c) => c.colorHex}
            />
          </Field>

          <Field label={`작업 블록 (${workBlocks.length})`}>
            {workBlocks.map((b, i) => (
              <View key={i} style={styles.block}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockType}>{b.workType}</Text>
                  <Pressable onPress={() => removeBlock(i)}>
                    <Text style={styles.blockRemove}>×</Text>
                  </Pressable>
                </View>
                <TextInput
                  value={b.detail}
                  onChangeText={(v) => updateBlockDetail(i, v)}
                  placeholder="작업 상세 (예: 점적관수 30분)"
                  maxLength={500}
                />
              </View>
            ))}
            <Button
              label="+ 작업 추가"
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

          <Field label={`사진 (${photos.length}/5)`}>
            <View style={styles.photoRow}>
              {photos.map((p) => (
                <View key={p.key} style={styles.photoChip}>
                  <Text style={styles.photoKey} numberOfLines={1}>
                    {p.key.split('/').slice(-1)[0]}
                  </Text>
                  <Pressable onPress={() => removePhoto(p.key)}>
                    <Text style={styles.photoRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Button
              label="사진 추가"
              variant="secondary"
              onPress={pickPhoto}
              disabled={photos.length >= 5}
              fullWidth
              loading={presign.isPending}
            />
          </Field>
        </ScrollView>
      </KeyboardAvoidingView>

      <WorkTypeSheet
        visible={showSheet}
        types={types.data ?? []}
        onSelect={addBlock}
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
  onSelect,
  onClose,
}: {
  visible: boolean;
  types: { code: string; label: string; icon: string }[];
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} title="작업 유형 선택" onClose={onClose} confirmLabel="취소">
      <View style={{ gap: space.sm, marginVertical: space.md }}>
        {types.map((t) => (
          <Pressable key={t.code} style={chipStyles.typeItem} onPress={() => onSelect(t.code)}>
            <Text style={{ fontSize: 22 }}>{t.icon}</Text>
            <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{t.label}</Text>
          </Pressable>
        ))}
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
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  toggle: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  toggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { ...typography.caption, color: colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  weatherText: { ...typography.body, color: colors.textPrimary },
  block: {
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: radius.md,
    ...shadow.card,
    gap: space.xs,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blockType: { ...typography.bodyBold, color: colors.primary },
  blockRemove: { fontSize: 22, color: colors.textTertiary },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  photoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    maxWidth: 140,
  },
  photoKey: { ...typography.caption, color: colors.textPrimary, marginRight: space.xs },
  photoRemove: { fontSize: 18, color: colors.danger },
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
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
});
