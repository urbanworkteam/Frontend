import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useJobResult, useJobStatus, useRegenerate, useUpdateResult } from '@/api/ai';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { SmartStoreMetaCard } from '@/screens/content/SmartStoreMetaCard';
import { ContentStepper } from '@/screens/content/Stepper';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

const PROGRESS_STEPS = [
  { key: 'ANALYZE_DIARY', label: '영농일지 데이터 분석', icon: '📋' },
  { key: 'FETCH_SEASON', label: '제철 정보 조회', icon: '🌾' },
  { key: 'GENERATE_CONTENT', label: '콘텐츠 생성 중', icon: '✨' },
];

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = id ? parseInt(id, 10) : null;
  const status = useJobStatus(jobId);
  const isDone = status.data?.status === 'DONE';
  const result = useJobResult(isDone ? jobId : null);
  const update = useUpdateResult();
  const regen = useRegenerate();
  const [caption, setCaption] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (result.data?.caption !== undefined && !editing) {
      setCaption(result.data.caption ?? '');
    }
  }, [result.data, editing]);

  const saveCaption = () =>
    jobId &&
    update.mutate(
      { jobId, body: { caption } },
      {
        onSuccess: () => {
          toast.success('저장되었습니다');
          setEditing(false);
        },
      },
    );

  const onRegen = () =>
    jobId &&
    regen.mutate(
      { jobId, body: {} },
      {
        onSuccess: (res) => {
          router.replace({ pathname: '/(tabs)/content/[id]', params: { id: String(res.jobId) } });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );

  // Stepper 진행도: status가 진행 중이면 3, DONE이면 4
  const stepperCurrent = isDone ? 4 : 3;

  // 백엔드 steps와 매핑해서 어느 progress step이 완료/진행 중인지 판단
  const backendSteps = status.data?.steps ?? [];
  const stepDone = (key: string) => backendSteps.find((s) => s.key === key)?.done ?? false;
  const stepInProgress = (key: string) => {
    if (stepDone(key)) return false;
    const idx = PROGRESS_STEPS.findIndex((s) => s.key === key);
    if (idx <= 0) return !stepDone(key);
    return stepDone(PROGRESS_STEPS[idx - 1].key);
  };
  const progressPct = status.data?.progressPct ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)/content')}>
          <Text style={styles.back}>← 목록</Text>
        </Pressable>
        <Text style={styles.title}>콘텐츠 만들기</Text>
        <View style={{ width: 60 }} />
      </View>

      <ContentStepper current={stepperCurrent as 1 | 2 | 3 | 4} />

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}>
        {!isDone ? (
          <>
            <View style={styles.statusHero}>
              <View style={styles.sparkleCircle}>
                <Text style={styles.sparkleIcon}>✨</Text>
              </View>
              <Text style={styles.statusTitle}>AI가 콘텐츠를 생성하고 있어요</Text>
              <Text style={styles.statusSub}>
                영농일지 데이터를 분석해{'\n'}최적의 콘텐츠를 만드는 중이에요
              </Text>
            </View>

            <View style={styles.progressList}>
              {PROGRESS_STEPS.map((s) => {
                const done = stepDone(s.key);
                const inProg = stepInProgress(s.key);
                return (
                  <View
                    key={s.key}
                    style={[
                      styles.progressCard,
                      (done || inProg) && styles.progressCardActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.progressDot,
                        done && styles.progressDotDone,
                        inProg && styles.progressDotInProg,
                      ]}
                    >
                      <Text style={[styles.progressDotText, (done || inProg) && { color: '#fff' }]}>
                        {done ? '✓' : inProg ? '↻' : ''}
                      </Text>
                    </View>
                    <Text style={[styles.progressLabel, (done || inProg) && styles.progressLabelActive]}>
                      {s.label}
                    </Text>
                    <View style={{ flex: 1 }} />
                    {done ? <Text style={styles.progressCheck}>✓</Text> : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.max(5, progressPct)}%` }]} />
            </View>

            {status.data?.failureReason ? (
              <Text style={styles.error}>{status.data.failureReason}</Text>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>이미지 ({result.data?.cardImageUrls.length})</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: space.sm }}
              >
                {(result.data?.cardImageUrls ?? []).map((u) => (
                  <Image key={u} source={{ uri: u }} style={styles.cardImg} />
                ))}
              </ScrollView>
            </View>

            {result.data?.platform === 'INSTAGRAM' ? (
              <>
                <View style={styles.card}>
                  <View style={styles.captionHeader}>
                    <Text style={styles.cardTitle}>캡션</Text>
                    {!editing ? (
                      <Pressable onPress={() => setEditing(true)}>
                        <Text style={styles.actionText}>편집</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={saveCaption}>
                        <Text style={styles.actionText}>저장</Text>
                      </Pressable>
                    )}
                  </View>
                  {editing ? (
                    <TextInput value={caption} onChangeText={setCaption} multiline maxLength={2200} />
                  ) : (
                    <Text style={styles.captionText}>{caption || '없음'}</Text>
                  )}
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>해시태그</Text>
                  <Text style={styles.tags}>{(result.data?.hashtags ?? []).join(' ')}</Text>
                </View>
              </>
            ) : null}

            {result.data?.platform === 'SMARTSTORE' && result.data?.storeMeta ? (
              <SmartStoreMetaCard meta={result.data.storeMeta} />
            ) : null}

            <View style={styles.actionRow}>
              <Button
                label="↻ 재생성"
                variant="secondary"
                onPress={onRegen}
                loading={regen.isPending}
                style={{ flex: 1 }}
              />
              <Button
                label="✓ 완료"
                onPress={() => router.replace('/(tabs)/content')}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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

  // Progress hero
  statusHero: {
    alignItems: 'center',
    paddingVertical: space.xl,
    gap: space.md,
  },
  sparkleCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: { fontSize: 40 },
  statusTitle: { ...typography.header, color: colors.textPrimary, textAlign: 'center' },
  statusSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  // Progress cards
  progressList: { gap: space.sm },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  progressCardActive: { backgroundColor: '#E6F4EA', borderColor: colors.primary },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressDotInProg: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressDotText: { fontSize: 12, color: colors.textTertiary, fontWeight: '700' },
  progressLabel: { ...typography.bodyBold, color: colors.textSecondary },
  progressLabelActive: { color: colors.primary },
  progressCheck: { color: colors.primary, fontWeight: '700' },

  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6F4EA',
    overflow: 'hidden',
    marginTop: space.md,
  },
  progressBarFill: { height: 6, backgroundColor: colors.primary },

  error: { ...typography.body, color: colors.danger, marginTop: space.md, textAlign: 'center' },

  // Result
  card: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.md, ...shadow.card },
  captionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { ...typography.bodyBold, color: colors.primary },
  cardTitle: { ...typography.title, color: colors.textPrimary },
  cardImg: { width: 240, height: 240, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  captionText: { ...typography.body, color: colors.textPrimary },
  tags: { ...typography.body, color: colors.info },
  actionRow: { flexDirection: 'row', gap: space.sm },
});
