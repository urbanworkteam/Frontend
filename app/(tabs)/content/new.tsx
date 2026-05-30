import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useCreateContent, Platform } from '@/api/ai';
import { useCrops } from '@/api/crop';
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

export default function ContentNewScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [cropId, setCropId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState('');
  const crops = useCrops();
  const create = useCreateContent();

  const onBack = () => {
    if (step === 2) setStep(1);
    else router.back();
  };

  const onNext = () => {
    if (!platform) {
      toast.info('플랫폼을 선택해주세요');
      return;
    }
    setStep(2);
  };

  const submit = () => {
    if (!platform) {
      toast.info('플랫폼을 선택해주세요');
      return;
    }
    if (!cropId) {
      toast.info('작물을 선택해주세요');
      return;
    }
    const idemKey = uuid();
    create.mutate(
      { body: { platform, cropId, keywords: keywords || undefined }, idempotencyKey: idemKey },
      {
        onSuccess: (res) => {
          router.replace({ pathname: '/(tabs)/content/[id]', params: { id: String(res.jobId) } });
        },
        onError: (e) => {
          const err = e as { code?: string; message?: string };
          if (err.code === 'CREDIT_EXHAUSTED') toast.error('크레딧이 소진되었습니다. 플랜을 확인해주세요.');
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }}>
          {step === 1 ? (
            <>
              <Text style={styles.stepTitle}>플랫폼을 선택하세요</Text>
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
              <Section title="홍보할 작물 선택 *">
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
                <Text style={styles.subHint}>
                  일지 선택 UI는 다음 업데이트에서 추가됩니다. 지금은 일지 없이 생성됩니다.
                </Text>
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
                label="✦ AI 콘텐츠 생성하기"
                onPress={submit}
                loading={create.isPending}
                disabled={!cropId}
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
  stepTitle: { ...typography.body, color: colors.textSecondary, marginBottom: -space.xs },

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

  subHint: { ...typography.caption, color: colors.textTertiary },
});
