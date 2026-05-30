import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMyPage } from '@/api/mypage';
import { useLogout, useWithdraw } from '@/api/auth';
import { Modal } from '@/ui/components/Modal';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

function formatResetAt(iso: string | null | undefined): string {
  if (!iso) return '매월 초기화';
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 초기화`;
  } catch {
    return '매월 초기화';
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  } catch {
    return '—';
  }
}

export default function MyPageScreen() {
  const mp = useMyPage();
  const logout = useLogout();
  const withdraw = useWithdraw();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  if (mp.isLoading || !mp.data) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }
  const d = mp.data;
  const name = d.account.name ?? '농민';
  const initial = name.charAt(0);
  const used = d.subscription.creditsUsed ?? 0;
  const limit = d.subscription.creditsLimit ?? 0;
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const isFree = d.subscription.plan === 'FREE';

  const onLogout = async () => {
    await logout.mutateAsync();
    router.replace('/(auth)/login');
  };

  const onWithdraw = async () => {
    try {
      await withdraw.mutateAsync(undefined);
      setWithdrawOpen(false);
      router.replace('/(auth)/login');
    } catch (e) {
      toast.error((e as Error).message ?? '탈퇴 처리에 실패했어요');
      setWithdrawOpen(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>마이페이지</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }}>
        {/* 계정 정보 카드 */}
        <View style={styles.accountCard}>
          <View style={styles.accountTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{name}</Text>
              <Text style={styles.userPhone}>{d.account.phone ?? '카카오 동기화'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Pressable
            style={styles.kvRow}
            onPress={() => router.push('/(tabs)/mypage/account')}
            hitSlop={4}
          >
            <Text style={styles.kvLabel}>이메일</Text>
            <Text style={styles.kvValue} numberOfLines={1}>
              {d.account.email ?? '-'}
            </Text>
          </Pressable>
        </View>

        {/* 농장 정보 */}
        <SectionTitle text="농장 정보" />
        <View style={styles.cardGroup}>
          <NavRow
            icon="🌱"
            label="재배 작물 관리"
            badge={
              d.crops.count > 0
                ? `${d.crops.preview[0] ?? ''}${d.crops.count > 1 ? ` 외 ${d.crops.count - 1}` : ''}`
                : '없음'
            }
            onPress={() => router.push('/(tabs)/mypage/crops')}
          />
          <View style={styles.rowDivider} />
          <NavRow
            icon="📍"
            label="농장 위치 관리"
            badge={d.farmLocations.count > 0 ? `${d.farmLocations.count}개` : '없음'}
            onPress={() => router.push('/(tabs)/mypage/locations')}
          />
        </View>

        {/* 구독 */}
        <SectionTitle text="구독" />
        <View style={styles.subCard}>
          <View style={styles.subTopRow}>
            <Text style={styles.subTitle}>현재 플랜</Text>
            <View style={[styles.planBadge, isFree ? styles.planBadgeFree : styles.planBadgePaid]}>
              <Text style={[styles.planBadgeText, isFree ? styles.planBadgeTextFree : styles.planBadgeTextPaid]}>
                {d.subscription.plan}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
          </View>
          <View style={styles.usageRow}>
            <Text style={styles.usageText}>
              AI 생성 {used} / {limit}회 사용
            </Text>
            <Text style={styles.usageReset}>{formatResetAt(d.subscription.resetAt)}</Text>
          </View>

          <View style={styles.subDivider} />

          <View style={styles.payRow}>
            <Text style={styles.payLabel}>결제일</Text>
            <Text style={styles.payValue}>{formatDate(d.subscription.lastPaidAt)}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>다음 결제일</Text>
            <Text style={styles.payValue}>{formatDate(d.subscription.nextBillingAt)}</Text>
          </View>

          <Pressable style={styles.upgradeBtn} onPress={() => router.push('/(tabs)/mypage/subscription')}>
            <Text style={styles.upgradeText}>✦ 플랜 업그레이드</Text>
          </Pressable>
        </View>

        {/* 설정 */}
        <SectionTitle text="설정" />
        <View style={styles.cardGroup}>
          <NavRow
            icon="🔔"
            label="알림 설정"
            onPress={() => router.push('/(tabs)/mypage/notifications')}
          />
        </View>

        {/* 계정 관리 */}
        <SectionTitle text="계정 관리" />
        <View style={styles.cardGroup}>
          <NavRow icon="↩" label="로그아웃" onPress={onLogout} />
          <View style={styles.rowDivider} />
          <NavRow
            icon=""
            label="회원 탈퇴"
            labelStyle={{ color: colors.danger }}
            onPress={() => setWithdrawOpen(true)}
          />
        </View>
      </ScrollView>

      <Modal
        visible={withdrawOpen}
        title="회원 탈퇴"
        message="30일 유예 후 영구 삭제됩니다. 유예 기간 내에 다시 로그인하면 복구할 수 있어요."
        confirmLabel="탈퇴"
        cancelLabel="취소"
        destructive
        onConfirm={onWithdraw}
        onClose={() => setWithdrawOpen(false)}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function NavRow({
  icon,
  label,
  badge,
  onPress,
  labelStyle,
}: {
  icon: string;
  label: string;
  badge?: string;
  onPress: () => void;
  labelStyle?: object;
}) {
  return (
    <Pressable style={styles.navRow} onPress={onPress} hitSlop={4}>
      {icon ? <Text style={styles.navIcon}>{icon}</Text> : null}
      <Text style={[styles.navLabel, labelStyle]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {badge ? (
        <View style={styles.navBadge}>
          <Text style={styles.navBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.navChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  topBar: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  topBarTitle: { ...typography.title, color: colors.textPrimary },

  // Account card
  accountCard: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    gap: space.md,
    ...shadow.card,
  },
  accountTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.primary },
  userName: { ...typography.header, color: colors.textPrimary },
  userPhone: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  kvRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kvLabel: { ...typography.body, color: colors.textSecondary },
  kvValue: { ...typography.body, color: colors.textPrimary, maxWidth: '60%' },

  // Section
  sectionTitle: { ...typography.caption, color: colors.textSecondary, marginBottom: -space.xs, marginLeft: space.xs },

  // Card group (vertical list of rows)
  cardGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  navIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  navLabel: { ...typography.body, color: colors.textPrimary },
  navBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  navBadgeText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  navChevron: { fontSize: 18, color: colors.textTertiary, marginLeft: space.xs },
  rowDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: space.lg },

  // Subscription card
  subCard: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    gap: space.sm,
    ...shadow.card,
  },
  subTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subTitle: { ...typography.title, color: colors.textPrimary },
  planBadge: { paddingHorizontal: space.md, paddingVertical: 4, borderRadius: radius.pill },
  planBadgeFree: { backgroundColor: '#E6F4EA' },
  planBadgePaid: { backgroundColor: colors.primary },
  planBadgeText: { ...typography.caption, fontWeight: '700' },
  planBadgeTextFree: { color: colors.primary },
  planBadgeTextPaid: { color: '#fff' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E6F4EA',
    overflow: 'hidden',
    marginTop: space.xs,
  },
  progressFill: { height: 8, backgroundColor: colors.primary },
  usageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usageText: { ...typography.body, color: colors.textPrimary },
  usageReset: { ...typography.caption, color: colors.textSecondary },
  subDivider: { height: 1, backgroundColor: colors.border, marginVertical: space.xs },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payLabel: { ...typography.body, color: colors.textSecondary },
  payValue: { ...typography.body, color: colors.textPrimary },
  upgradeBtn: {
    marginTop: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  upgradeText: { ...typography.bodyBold, color: colors.primary },
});
