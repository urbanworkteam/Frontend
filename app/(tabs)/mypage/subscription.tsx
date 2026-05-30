import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useCancelSubscription, usePlans, useSubscription, useStartCheckout } from '@/api/subscription';
import { Button } from '@/ui/components/Button';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function SubscriptionScreen() {
  const sub = useSubscription();
  const plans = usePlans();
  const startCheckout = useStartCheckout();
  const cancel = useCancelSubscription();

  const onSelectPlan = (code: string) => {
    if (code === 'FREE' || code === sub.data?.plan) return;
    startCheckout.mutate(code, {
      onSuccess: (data) => {
        router.push({
          pathname: '/(tabs)/mypage/checkout',
          params: {
            checkoutId: String(data.checkoutId),
            merchantUid: data.merchantUid,
            amount: String(data.amount),
            plan: code,
          },
        });
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack('/(tabs)/mypage')}><Text style={styles.back}>← 뒤로</Text></Pressable>
        <Text style={styles.title}>구독 / 결제</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>현재 플랜</Text>
          {sub.isLoading ? <ActivityIndicator /> : (
            <View style={{ gap: space.xs }}>
              <Text style={styles.planName}>{sub.data?.plan}</Text>
              <Text style={styles.detail}>상태: {sub.data?.status}</Text>
              <Text style={styles.detail}>다음 갱신: {sub.data?.currentPeriodEnd && new Date(sub.data.currentPeriodEnd).toLocaleDateString('ko-KR')}</Text>
              <Text style={styles.detail}>크레딧: {sub.data?.creditsUsed} / {sub.data?.creditsLimit}</Text>
            </View>
          )}
          {sub.data?.plan !== 'FREE' && sub.data?.status === 'ACTIVE' ? (
            <Button
              label="구독 취소"
              variant="ghost"
              onPress={() => cancel.mutate(undefined, { onSuccess: () => toast.info('취소되었습니다 — 만료일까지 사용 가능') })}
              fullWidth
            />
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>플랜 선택</Text>
        {plans.isLoading ? <ActivityIndicator /> : null}
        {(plans.data ?? []).map((p) => {
          const isCurrent = sub.data?.plan === p.code;
          return (
            <View key={p.code} style={[styles.planCard, p.recommended && { borderColor: colors.primary }]}>
              <View style={styles.planRow}>
                <Text style={styles.planName}>{p.name}</Text>
                {p.comingSoon ? <Text style={styles.badge}>준비 중</Text> : null}
                {p.recommended ? <Text style={[styles.badge, { backgroundColor: colors.primary, color: '#fff' }]}>추천</Text> : null}
              </View>
              <Text style={styles.price}>{p.price === 0 ? '무료' : `₩${p.price.toLocaleString()}`} / {p.period === 'MONTHLY' ? '월' : p.period}</Text>
              <Text style={styles.detail}>크레딧: {p.creditsLimit ?? '무제한'}</Text>
              {p.features.map((f, i) => (
                <Text key={i} style={styles.feature}>· {f}</Text>
              ))}
              <Button
                label={isCurrent ? '현재 플랜' : p.disabled ? '준비 중' : '시작하기'}
                onPress={() => onSelectPlan(p.code)}
                disabled={isCurrent || p.disabled}
                loading={startCheckout.isPending}
                variant={p.recommended ? 'primary' : 'secondary'}
                fullWidth
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  card: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.md, ...shadow.card },
  sectionTitle: { ...typography.title, color: colors.textPrimary },
  planName: { ...typography.header, color: colors.textPrimary },
  detail: { ...typography.body, color: colors.textSecondary },
  feature: { ...typography.caption, color: colors.textSecondary },
  planCard: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.sm, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  price: { ...typography.title, color: colors.primary },
  badge: { ...typography.caption, color: colors.textSecondary, backgroundColor: colors.surfaceMuted, paddingVertical: 2, paddingHorizontal: space.xs, borderRadius: radius.pill, overflow: 'hidden' },
});
