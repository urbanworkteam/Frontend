import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform as RNPlatform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCreateContent, Platform } from '@/api/ai';
import { useCrops } from '@/api/crop';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function ContentNewScreen() {
  const [platform, setPlatform] = useState<Platform>('INSTAGRAM');
  const [cropId, setCropId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState('');
  const crops = useCrops();
  const create = useCreateContent();

  const submit = () => {
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
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← 취소</Text></Pressable>
        <Text style={styles.title}>콘텐츠 생성</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
          <Section title="플랫폼">
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {(['INSTAGRAM', 'SMARTSTORE'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPlatform(p)}
                  style={[styles.platformCard, platform === p && styles.platformSel]}
                >
                  <Text style={{ fontSize: 28 }}>{p === 'INSTAGRAM' ? '📸' : '🛒'}</Text>
                  <Text style={[styles.platformLabel, platform === p && { color: '#fff' }]}>
                    {p === 'INSTAGRAM' ? '인스타그램 카드뉴스' : '스마트스토어 상세'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="작물">
            {crops.isLoading ? <ActivityIndicator /> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
              {(crops.data ?? []).map((c) => {
                const sel = c.id === cropId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCropId(c.id)}
                    style={[styles.chip, sel && { backgroundColor: c.colorHex, borderColor: c.colorHex }]}
                  >
                    <Text style={[styles.chipText, sel && { color: '#fff' }]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="키워드 (선택)">
            <TextInput
              value={keywords}
              onChangeText={setKeywords}
              placeholder="친환경, 첫 수확"
              maxLength={200}
            />
            <Text style={styles.hint}>강조하고 싶은 키워드를 쉼표로 구분해 입력해주세요.</Text>
          </Section>

          <Button label="콘텐츠 생성 시작" onPress={submit} loading={create.isPending} disabled={!cropId} fullWidth />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  sectionTitle: { ...typography.title, color: colors.textPrimary },
  platformCard: { flex: 1, alignItems: 'center', padding: space.lg, gap: space.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  platformSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  platformLabel: { ...typography.bodyBold, color: colors.textPrimary, textAlign: 'center' },
  chip: { paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipText: { ...typography.body, color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textTertiary },
});
