import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
      {/* 상단 바 */}
      <View style={styles.headerRow}>
        <Text style={styles.headerBrand}>Farmily</Text>
        <Text style={styles.headerSubtitle}>AI 콘텐츠</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}>
        {/* 크레딧 + 생성 버튼 */}
        <View style={styles.actionRow}>
          <Button label="+ 새 콘텐츠 생성" size="sm" onPress={() => router.push('/(tabs)/content/new')} />
          <Text style={styles.creditsText}>
            {credits.data
              ? `${credits.data.plan} · 남은 ${credits.data.creditsRemaining}/${credits.data.creditsLimit}`
              : ''}
          </Text>
        </View>

        {/* 필터 */}
        <View style={styles.filterRow}>
          {(['ALL', 'INSTAGRAM', 'SMARTSTORE'] as const).map((p) => {
            const sel = (p === 'ALL' && platform === null) || p === platform;
            const label = p === 'ALL' ? '전체' : p === 'INSTAGRAM' ? '인스타그램' : '스마트스토어';
            return (
              <Pressable
                key={p}
                onPress={() => setPlatform(p === 'ALL' ? null : (p as Platform))}
                style={[styles.filter, sel && styles.filterSel]}
              >
                <Text style={[styles.filterText, sel && { color: '#fff' }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 콘텐츠 목록 */}
        {history.isLoading ? <ActivityIndicator style={{ marginTop: space.xl }} /> : null}
        {(history.data?.data ?? []).map((it) => (
          <Pressable
            key={it.id}
            onPress={() => router.push({ pathname: '/(tabs)/content/[id]', params: { id: String(it.id) } })}
            style={styles.card}
          >
            {it.thumbnailUrl ? (
              <Image source={{ uri: it.thumbnailUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="sparkles" size={24} color={colors.primary} />
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.platformBadge}>
                  {it.platform === 'INSTAGRAM' ? '인스타그램' : '스마트스토어'}
                </Text>
                <Text style={styles.date}>{new Date(it.createdAt).toLocaleDateString('ko-KR')}</Text>
              </View>
              <Text style={styles.caption} numberOfLines={2}>{it.caption ?? '결과 준비 중'}</Text>
            </View>
          </Pressable>
        ))}
        {!history.isLoading && (history.data?.data ?? []).length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="sparkles-outline" size={32} color={colors.textTertiary} />
            <Text style={styles.emptyText}>아직 생성한 콘텐츠가 없습니다</Text>
            <Text style={styles.emptyHint}>위 버튼을 눌러 AI 콘텐츠를 만들어보세요</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    height: 52,
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBrand: { ...typography.bodyBold, color: colors.textPrimary },
  headerSubtitle: { ...typography.bodyBold, color: colors.textPrimary },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsText: { ...typography.caption, color: colors.textSecondary },

  filterRow: { flexDirection: 'row', gap: space.xs },
  filter: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  filterSel: { backgroundColor: colors.primary },
  filterText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, justifyContent: 'center', gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  platformBadge: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  caption: { ...typography.body, color: colors.textPrimary, lineHeight: 20 },
  date: { ...typography.caption, color: colors.textTertiary },

  emptyBox: { alignItems: 'center', gap: space.sm, marginTop: space.xxl, padding: space.xl },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptyHint: { ...typography.caption, color: colors.textTertiary },
});
