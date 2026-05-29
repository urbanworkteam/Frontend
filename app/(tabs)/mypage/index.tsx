import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMyPage } from '@/api/mypage';
import { useLogout, useWithdraw } from '@/api/auth';
import { Button } from '@/ui/components/Button';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function MyPageScreen() {
  const mp = useMyPage();
  const logout = useLogout();
  const withdraw = useWithdraw();

  if (mp.isLoading || !mp.data) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  const d = mp.data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={styles.h1}>마이페이지</Text>

        <Card>
          <Text style={styles.sectionTitle}>계정</Text>
          <Row label="이름" value={d.account.name ?? '-'} />
          <Row label="이메일" value={d.account.email ?? '-'} />
          <Row label="전화" value={d.account.phone ?? '카카오 동기화'} />
          <Button label="계정 정보 수정" variant="secondary" onPress={() => router.push('/(tabs)/mypage/account')} fullWidth />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>재배 작물 ({d.crops.count})</Text>
          <Text style={styles.preview}>{d.crops.preview.join(', ') || '등록된 작물 없음'}</Text>
          <Button label="작물 관리" variant="secondary" onPress={() => router.push('/(tabs)/mypage/crops')} fullWidth />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>농장 위치 ({d.farmLocations.count})</Text>
          <Button label="농장 위치 관리" variant="secondary" onPress={() => router.push('/(tabs)/mypage/locations')} fullWidth />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>구독</Text>
          <Row label="플랜" value={d.subscription.plan} />
          <Row label="크레딧" value={`${d.subscription.creditsUsed} / ${d.subscription.creditsLimit}`} />
          <Button label="플랜 / 결제" variant="secondary" onPress={() => router.push('/(tabs)/mypage/subscription')} fullWidth />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>알림</Text>
          <Button label="알림 설정" variant="secondary" onPress={() => router.push('/(tabs)/mypage/notifications')} fullWidth />
        </Card>

        <Card>
          <Button
            label="로그아웃"
            variant="secondary"
            onPress={async () => {
              await logout.mutateAsync();
              router.replace('/(auth)/login');
            }}
            fullWidth
          />
          <Button
            label="회원 탈퇴"
            variant="danger"
            onPress={async () => {
              const ok = await new Promise<boolean>((resolve) => {
                toast.info('30일 유예 후 영구 삭제됩니다');
                setTimeout(() => resolve(true), 1500);
              });
              if (!ok) return;
              await withdraw.mutateAsync(undefined);
              router.replace('/(auth)/login');
            }}
            fullWidth
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  h1: { ...typography.header, color: colors.textPrimary, marginBottom: space.xs },
  card: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.md, ...shadow.card },
  sectionTitle: { ...typography.title, color: colors.textPrimary },
  preview: { ...typography.body, color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.textPrimary },
});
