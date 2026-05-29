import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useJobResult, useJobStatus, useRegenerate, useUpdateResult } from '@/api/ai';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)/content')}><Text style={styles.back}>← 목록</Text></Pressable>
        <Text style={styles.title}>콘텐츠 #{jobId}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        {!isDone ? (
          <View style={styles.statusCard}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.statusTitle}>{statusLabel(status.data?.status)}</Text>
            <View style={{ marginTop: space.md, gap: space.xs }}>
              {(status.data?.steps ?? []).map((s) => (
                <Text key={s.key} style={{ ...typography.body, color: s.done ? colors.primary : colors.textTertiary }}>
                  {s.done ? '✓' : '○'} {s.label}
                </Text>
              ))}
            </View>
            {status.data?.failureReason ? (
              <Text style={styles.error}>{status.data.failureReason}</Text>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>이미지 ({result.data?.cardImageUrls.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
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
                      <Pressable onPress={() => setEditing(true)}><Text style={styles.actionText}>편집</Text></Pressable>
                    ) : (
                      <Pressable onPress={saveCaption}><Text style={styles.actionText}>저장</Text></Pressable>
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

            <Button label="재생성 (24h 3회 무료)" variant="secondary" onPress={onRegen} loading={regen.isPending} fullWidth />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusLabel(s?: string) {
  switch (s) {
    case 'QUEUED':
      return '대기 중';
    case 'ANALYZING':
      return '영농일지 분석 중';
    case 'ENRICHING':
      return '제철 정보 조회 중';
    case 'GENERATING':
      return '콘텐츠 생성 중';
    case 'FAILED':
      return '실패';
    case 'REFUNDED':
      return '환불됨';
    default:
      return '준비 중';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  statusCard: { backgroundColor: colors.surface, padding: space.xl, borderRadius: radius.md, alignItems: 'center', gap: space.md, ...shadow.card },
  statusTitle: { ...typography.title, color: colors.textPrimary },
  error: { ...typography.body, color: colors.danger, marginTop: space.md, textAlign: 'center' },
  card: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.md, ...shadow.card },
  captionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { ...typography.bodyBold, color: colors.primary },
  cardTitle: { ...typography.title, color: colors.textPrimary },
  cardImg: { width: 240, height: 240, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  captionText: { ...typography.body, color: colors.textPrimary },
  tags: { ...typography.body, color: colors.info },
});
