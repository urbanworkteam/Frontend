import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/ui/components/Button';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];
function formatShortKoreanDate(s: string | undefined): string {
  if (!s) return '오늘';
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${KOR_DOW[dt.getDay()]})`;
}

export default function DiaryWriteCompleteScreen() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const diaryId = id ? parseInt(id, 10) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>영농일지 작성</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.doneTitle}>{formatShortKoreanDate(date)} 영농일지 저장 완료</Text>
        <Text style={styles.doneSubtitle}>일지가 안전하게 저장되었어요.</Text>

        <View style={{ width: '100%', gap: space.md, marginTop: space.xl }}>
          <Button
            label="← 달력으로 돌아가기"
            variant="secondary"
            onPress={() => router.replace('/(tabs)/diary')}
            fullWidth
          />
          {diaryId ? (
            <Pressable
              onPress={() =>
                router.replace({ pathname: '/(tabs)/diary/[id]', params: { id: String(diaryId) } })
              }
              hitSlop={8}
            >
              <Text style={styles.viewLink}>방금 작성한 일지 보기 →</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.aiNotice}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={styles.aiNoticeText}>
            방금 작성한 일지 데이터가 자동으로 콘텐츠 생성에 활용됩니다
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  headerTitle: { ...typography.title, color: colors.textPrimary },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  checkMark: { fontSize: 48, color: colors.primary, lineHeight: 52 },
  doneTitle: { ...typography.header, color: colors.textPrimary, textAlign: 'center' },
  doneSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  viewLink: { ...typography.bodyBold, color: colors.primary, textAlign: 'center' },
  aiNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xs,
    marginTop: space.xl,
    padding: space.md,
    backgroundColor: '#E6F4EA',
    borderRadius: radius.md,
    width: '100%',
    ...shadow.card,
  },
  aiNoticeIcon: { color: colors.primary, fontSize: 16, lineHeight: 20 },
  aiNoticeText: { ...typography.body, color: colors.primary, flex: 1, lineHeight: 20 },
});
