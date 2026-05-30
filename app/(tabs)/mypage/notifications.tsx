import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/api/notification';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

export default function NotificationsScreen() {
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();

  const toggle = (key: 'pushEnabled' | 'diaryReminderEnabled' | 'trendPushEnabled' | 'marketingPushEnabled', value: boolean) => {
    update.mutate({ [key]: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack('/(tabs)/mypage')}><Text style={styles.back}>← 뒤로</Text></Pressable>
        <Text style={styles.title}>알림 설정</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <View style={styles.card}>
          {settings.isLoading || !settings.data ? (
            <ActivityIndicator />
          ) : (
            <>
              <Row
                title="전체 푸시 알림"
                value={settings.data.pushEnabled}
                onChange={(v) => toggle('pushEnabled', v)}
              />
              <Row
                title="영농일지 리마인드 (매일 18시)"
                value={settings.data.diaryReminderEnabled}
                onChange={(v) => toggle('diaryReminderEnabled', v)}
                disabled={!settings.data.pushEnabled}
              />
              <Row
                title="트렌드 추천"
                value={settings.data.trendPushEnabled}
                onChange={(v) => toggle('trendPushEnabled', v)}
                disabled={!settings.data.pushEnabled}
              />
              <Row
                title="마케팅 / 이벤트"
                value={settings.data.marketingPushEnabled}
                onChange={(v) => toggle('marketingPushEnabled', v)}
                disabled={!settings.data.pushEnabled}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  title,
  value,
  onChange,
  disabled,
}: {
  title: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  card: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.md, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { ...typography.body, color: colors.textPrimary, flex: 1 },
});
