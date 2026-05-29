import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useContentHistory, useCredits, Platform } from '@/api/ai';
import { Button } from '@/ui/components/Button';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

export default function ContentHomeScreen() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const history = useContentHistory(platform);
  const credits = useCredits();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>AI 콘텐츠</Text>
        <Button label="+ 생성" size="sm" onPress={() => router.push('/(tabs)/content/new')} />
      </View>

      <View style={styles.creditsBar}>
        <Text style={styles.creditsText}>
          {credits.data
            ? `${credits.data.plan} · 남은 크레딧 ${credits.data.creditsRemaining} / ${credits.data.creditsLimit}`
            : '...'}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {(['ALL', 'INSTAGRAM', 'SMARTSTORE'] as const).map((p) => {
          const sel = (p === 'ALL' && platform === null) || p === platform;
          return (
            <Pressable
              key={p}
              onPress={() => setPlatform(p === 'ALL' ? null : (p as Platform))}
              style={[styles.filter, sel && styles.filterSel]}
            >
              <Text style={[styles.filterText, sel && { color: '#fff' }]}>{p}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        {history.isLoading ? <ActivityIndicator /> : null}
        {(history.data?.data ?? []).map((it) => (
          <Pressable
            key={it.id}
            onPress={() => router.push({ pathname: '/(tabs)/content/[id]', params: { id: String(it.id) } })}
            style={styles.card}
          >
            {it.thumbnailUrl ? (
              <Image source={{ uri: it.thumbnailUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 28 }}>✨</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.platform}>{it.platform}</Text>
              <Text style={styles.caption} numberOfLines={2}>{it.caption ?? '결과 준비 중'}</Text>
              <Text style={styles.date}>{new Date(it.createdAt).toLocaleDateString('ko-KR')}</Text>
            </View>
          </Pressable>
        ))}
        {!history.isLoading && (history.data?.data ?? []).length === 0 ? (
          <Text style={styles.empty}>아직 생성한 콘텐츠가 없습니다.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  headerTitle: { ...typography.header, color: colors.textPrimary },
  creditsBar: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  creditsText: { ...typography.caption, color: colors.textSecondary },
  filterRow: { flexDirection: 'row', gap: space.xs, paddingHorizontal: space.lg, paddingBottom: space.md },
  filter: { paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  filterSel: { backgroundColor: colors.primary },
  filterText: { ...typography.caption, color: colors.textPrimary },
  card: { flexDirection: 'row', gap: space.md, backgroundColor: colors.surface, padding: space.md, borderRadius: radius.md, ...shadow.card },
  thumb: { width: 72, height: 72, borderRadius: radius.sm },
  platform: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  caption: { ...typography.body, color: colors.textPrimary },
  date: { ...typography.small, color: colors.textTertiary },
  empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', marginTop: space.xxl },
});
