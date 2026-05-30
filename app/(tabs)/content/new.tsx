import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useCreateContent, Platform } from '@/api/ai';
import { useCrops } from '@/api/crop';
import { useDiaryListByCrop, useWorkTypes } from '@/api/diary';
import { extOf, uploadToS3, usePresign } from '@/api/upload';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { ContentStepper } from '@/screens/content/Stepper';
import { colors, radius, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatDiaryDate(s: string): string {
  const [, m, d] = s.split('-').map(Number);
  return `${m}월 ${d}일`;
}

type PhotoSlot = { key: string; previewUrl?: string };

export default function ContentNewScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [cropId, setCropId] = useState<number | null>(null);
  const [selectedDiaryId, setSelectedDiaryId] = useState<number | null>(null);
  const [withoutDiary, setWithoutDiary] = useState(false);
  const [extraPhotos, setExtraPhotos] = useState<PhotoSlot[]>([]);
  const [keywords, setKeywords] = useState('');

  const crops = useCrops();
  const diaries = useDiaryListByCrop(cropId, { limit: 20 });
  const types = useWorkTypes();
  const presign = usePresign();
  const create = useCreateContent();

  // 작물 바꾸면 일지 선택 초기화
  useEffect(() => {
    setSelectedDiaryId(null);
    setWithoutDiary(false);
  }, [cropId]);

  const workTypeLabel = (code: string) =>
    types.data?.find((t) => t.code === code)?.label ?? code;

  const onBack = () => {
    if (step === 2) setStep(1);
    else safeBack('/(tabs)/content');
  };

  const onNext = () => {
    if (!platform) {
      toast.info('플랫폼을 선택해주세요');
      return;
    }
    setStep(2);
  };

  const pickExtraPhoto = async () => {
    if (extraPhotos.length >= 3) {
      toast.info('추가 사진은 최대 3장까지 첨부할 수 있어요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      toast.error('10MB 이하 이미지만 첨부 가능합니다');
      return;
    }
    try {
      const ps = await presign.mutateAsync({
        kind: 'CONTENT_EXTRA',
        ext: extOf(asset.uri),
        sizeBytes: asset.fileSize ?? 0,
      });
      const blob = await (await fetch(asset.uri)).blob();
      await uploadToS3(ps.uploadUrl, blob, asset.mimeType ?? 'image/jpeg');
      setExtraPhotos((s) => [...s, { key: ps.key, previewUrl: ps.publicUrl ?? asset.uri }]);
    } catch {
      toast.error('사진 업로드에 실패했어요');
    }
  };

  const removeExtraPhoto = (key: string) =>
    setExtraPhotos((s) => s.filter((p) => p.key !== key));

  const canSubmit =
    !!platform && !!cropId && (selectedDiaryId !== null || withoutDiary) && !create.isPending;

  const submit = () => {
    if (!canSubmit) return;
    const idemKey = uuid();
    create.mutate(
      {
        body: {
          platform: platform!,
          cropId: cropId!,
          diaryIds: selectedDiaryId !== null ? [selectedDiaryId] : undefined,
          keywords: keywords || undefined,
          extraPhotoKeys: extraPhotos.length > 0 ? extraPhotos.map((p) => p.key) : undefined,
        },
        idempotencyKey: idemKey,
      },
      {
        onSuccess: (res) => {
          router.replace({ pathname: '/(tabs)/content/[id]', params: { id: String(res.jobId) } });
        },
        onError: (e) => {
          const err = e as { code?: string; message?: string };
          if (err.code === 'CREDIT_EXHAUSTED')
            toast.error('크레딧이 소진되었습니다. 플랜을 확인해주세요.');
          else toast.error(err.message ?? '생성에 실패했어요');
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← {step === 2 ? '이전' : '취소'}</Text>
        </Pressable>
        <Text style={styles.title}>콘텐츠 만들기</Text>
        <View style={{ width: 60 }} />
      </View>

      <ContentStepper current={step} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }}>
          {step === 1 ? (
            <>
              <Text style={styles.stepHint}>플랫폼을 선택하세요</Text>
              <View style={styles.platformRow}>
                {(['INSTAGRAM', 'SMARTSTORE'] as const).map((p) => {
                  const sel = platform === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPlatform(p)}
                      style={[styles.platformCard, sel && styles.platformSel]}
                    >
                      <Text style={{ fontSize: 32 }}>{p === 'INSTAGRAM' ? '📸' : '🛒'}</Text>
                      <Text style={[styles.platformLabel, sel && { color: colors.primary }]}>
                        {p === 'INSTAGRAM' ? '인스타그램' : '스마트스토어'}
                      </Text>
                      <Text style={styles.platformSub}>
                        {p === 'INSTAGRAM' ? '카드뉴스 + 캡션 + 해시태그' : '상품 소개 이미지'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button label="다음" onPress={onNext} disabled={!platform} fullWidth />
            </>
          ) : (
            <>
              <Section title="홍보할 작물 *">
                {crops.isLoading ? <ActivityIndicator /> : null}
                <View style={styles.cropList}>
                  {(crops.data ?? []).map((c) => {
                    const sel = c.id === cropId;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setCropId(c.id)}
                        style={[styles.cropRow, sel && styles.cropRowSel]}
                      >
                        <View style={[styles.cropIcon, { backgroundColor: c.colorHex + '33' }]}>
                          <Text style={{ fontSize: 16 }}>🌱</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cropName}>{c.name}</Text>
                          {c.stage ? <Text style={styles.cropStage}>{c.stage}</Text> : null}
                        </View>
                        <View style={[styles.radio, sel && styles.radioSel]}>
                          {sel ? <Text style={styles.radioMark}>✓</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>

              <Section title="영농일지 선택 (선택)">
                {cropId === null ? (
                  <Text style={styles.subHint}>작물을 먼저 선택해주세요.</Text>
                ) : diaries.isLoading ? (
                  <ActivityIndicator />
                ) : (diaries.data?.data ?? []).length === 0 ? (
                  <View style={styles.emptyDiaryCard}>
                    <Text style={styles.emptyDiaryText}>
                      이 작물로 작성한 일지가 없어요.{'\n'}일지 없이 생성하기를 선택하거나 일지를 먼저 작성해주세요.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.diaryList}>
                    {(diaries.data?.data ?? []).map((d) => {
                      const sel = d.id === selectedDiaryId && !withoutDiary;
                      const firstWork = d.workBlocks[0];
                      return (
                        <Pressable
                          key={d.id}
                          onPress={() => {
                            setSelectedDiaryId(d.id);
                            setWithoutDiary(false);
                          }}
                          style={[styles.diaryRow, sel && styles.diaryRowSel]}
                        >
                          <Text style={styles.diaryDate}>{formatDiaryDate(d.date)}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.diarySummary}>
                              {d.crop?.name ?? '-'} · {workTypeLabel(firstWork?.workType ?? '')}
                            </Text>
                            {d.memo ? (
                              <Text style={styles.diaryMemo} numberOfLines={1}>
                                {d.memo}
                              </Text>
                            ) : (
                              <Text style={[styles.diaryMemo, { color: colors.textTertiary }]}>
                                메모 없음
                              </Text>
                            )}
                          </View>
                          <View style={[styles.radio, sel && styles.radioSel]}>
                            {sel ? <Text style={styles.radioMark}>✓</Text> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                <Pressable
                  onPress={() => {
                    setSelectedDiaryId(null);
                    setWithoutDiary(true);
                  }}
                  hitSlop={4}
                  style={[styles.withoutDiaryLink, withoutDiary && styles.withoutDiaryLinkSel]}
                >
                  <Text
                    style={[
                      styles.withoutDiaryText,
                      withoutDiary && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {withoutDiary ? '✓ 일지 없이 생성하기' : '일지 없이 생성하기'}
                  </Text>
                </Pressable>
              </Section>

              <Section title={`추가 사진 (${extraPhotos.length}/3 · 선택)`}>
                <View style={styles.photoGrid}>
                  {extraPhotos.map((p) => (
                    <View key={p.key} style={styles.photoThumb}>
                      {p.previewUrl ? (
                        <Image
                          source={{ uri: p.previewUrl }}
                          style={styles.photoImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.photoImage, styles.photoFallback]}>
                          <Text style={styles.photoFallbackIcon}>🖼️</Text>
                        </View>
                      )}
                      <Pressable
                        style={styles.photoRemoveBtn}
                        onPress={() => removeExtraPhoto(p.key)}
                        hitSlop={4}
                      >
                        <Text style={styles.photoRemoveText}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                  {extraPhotos.length < 3 ? (
                    <Pressable
                      style={styles.photoAdd}
                      onPress={pickExtraPhoto}
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
              </Section>

              <Section title="강조 키워드 (선택)">
                <TextInput
                  value={keywords}
                  onChangeText={setKeywords}
                  placeholder="친환경, 첫 수확"
                  maxLength={200}
                  multiline
                />
                <Text style={styles.subHint}>강조하고 싶은 키워드를 쉼표로 구분해 입력해주세요.</Text>
              </Section>

              <Button
                label={create.isPending ? '생성 요청 중...' : '✦ AI 콘텐츠 생성하기'}
                onPress={submit}
                loading={create.isPending}
                disabled={!canSubmit}
                fullWidth
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  stepHint: { ...typography.body, color: colors.textSecondary, marginBottom: -space.xs },

  platformRow: { flexDirection: 'row', gap: space.md },
  platformCard: {
    flex: 1,
    alignItems: 'center',
    padding: space.lg,
    gap: space.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  platformSel: { backgroundColor: '#E6F4EA', borderColor: colors.primary },
  platformLabel: { ...typography.bodyBold, color: colors.textPrimary },
  platformSub: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },

  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary },
  subHint: { ...typography.caption, color: colors.textTertiary },

  // Crop list
  cropList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cropRowSel: { backgroundColor: '#E6F4EA' },
  cropIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cropName: { ...typography.bodyBold, color: colors.textPrimary },
  cropStage: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioMark: { color: '#fff', fontSize: 12, lineHeight: 14, fontWeight: '700' },

  // Diary list
  diaryList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  diaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  diaryRowSel: { backgroundColor: '#E6F4EA' },
  diaryDate: { ...typography.caption, color: colors.textSecondary, width: 56 },
  diarySummary: { ...typography.bodyBold, color: colors.textPrimary },
  diaryMemo: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  emptyDiaryCard: {
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  emptyDiaryText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  withoutDiaryLink: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  withoutDiaryLinkSel: {},
  withoutDiaryText: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Extra photos
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
});
