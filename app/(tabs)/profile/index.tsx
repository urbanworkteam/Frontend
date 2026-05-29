import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMyProfile, BlockType } from '@/api/profile';
import { Button } from '@/ui/components/Button';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

const blockLabel: Record<BlockType, string> = {
  CROP_INTRO: '재배 작물 소개',
  STORY: '재배 스토리',
  CALENDAR: '영농 달력',
  DIVIDER: '구분선',
  TEXT: '텍스트',
};

export default function MyProfileScreen() {
  const profile = useMyProfile();

  if (profile.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }
  const p = profile.data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View style={styles.headerBg}>
          {p?.farm.backgroundImageUrl ? (
            <Image source={{ uri: p.farm.backgroundImageUrl }} style={StyleSheet.absoluteFillObject} />
          ) : null}
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/(tabs)/profile/edit')} style={styles.editBtn}>
              <Text style={styles.editText}>편집</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            {p?.farm.avatarImageUrl ? (
              <Image source={{ uri: p.farm.avatarImageUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Text style={{ fontSize: 32 }}>🌾</Text>
            )}
          </View>
          <Text style={styles.farmName}>{p?.farm.farmName ?? '농장명 미설정'}</Text>
          <Text style={styles.region}>{p?.farm.region} · {p?.farm.farmingMethod}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>판매처</Text>
          <View style={styles.channelRow}>
            {(p?.salesChannels ?? []).map((c) => (
              <View key={c.id} style={styles.channelChip}>
                <Text style={styles.channelText}>{c.channel}</Text>
              </View>
            ))}
            {p?.salesChannels.length === 0 ? (
              <Text style={styles.emptyText}>등록된 판매처가 없습니다</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>명함 블록</Text>
          {(p?.blocks ?? []).map((b) => (
            <View key={b.id} style={[styles.blockCard, !b.visible && { opacity: 0.4 }]}>
              <Text style={styles.blockLabel}>{blockLabel[b.blockType]}</Text>
              <Text style={styles.blockVisible}>{b.visible ? '노출' : '숨김'}</Text>
            </View>
          ))}
          <Button label="블록 관리" variant="secondary" onPress={() => router.push('/(tabs)/profile/edit')} fullWidth />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>달력</Text>
          <Button
            label="명함 달력 보기"
            variant="secondary"
            onPress={() => router.push('/(tabs)/profile/calendar')}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  headerBg: { height: 160, backgroundColor: colors.primaryDim, position: 'relative' },
  headerActions: { position: 'absolute', top: space.md, right: space.md, flexDirection: 'row', gap: space.xs },
  editBtn: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill },
  editText: { color: '#fff', ...typography.caption },
  headerInfo: { alignItems: 'center', marginTop: -40, paddingBottom: space.lg, gap: space.xs },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface,
  },
  farmName: { ...typography.header, color: colors.textPrimary, marginTop: space.sm },
  region: { ...typography.caption, color: colors.textSecondary },
  section: { marginHorizontal: space.lg, marginTop: space.md, gap: space.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, ...shadow.card },
  sectionTitle: { ...typography.title, color: colors.textPrimary },
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  channelChip: { backgroundColor: colors.surfaceMuted, paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill },
  channelText: { ...typography.caption, color: colors.textPrimary },
  emptyText: { ...typography.caption, color: colors.textTertiary },
  blockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  blockLabel: { ...typography.body, color: colors.textPrimary },
  blockVisible: { ...typography.caption, color: colors.textSecondary },
});
