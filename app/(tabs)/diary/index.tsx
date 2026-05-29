import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MonthCalendar } from '@/ui/components/MonthCalendar';
import { useDiaryCalendar } from '@/api/diary';
import { Button } from '@/ui/components/Button';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DiaryHome() {
  const today = todayStr();
  const [ym, setYm] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [selected, setSelected] = useState<string>(today);
  const cal = useDiaryCalendar(ym.year, ym.month);

  const tagsByDate = useMemo(() => {
    const m: Record<string, { color: string }[]> = {};
    cal.data?.days.forEach((d) => {
      m[d.date] = d.tags.map((t) => ({ color: t.color }));
    });
    return m;
  }, [cal.data]);

  const selectedDay = useMemo(
    () => cal.data?.days.find((d) => d.date === selected),
    [cal.data, selected],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>영농일지</Text>
        <Button label="+ 작성" size="sm" onPress={() => router.push('/(tabs)/diary/write')} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <MonthCalendar
          year={ym.year}
          month={ym.month}
          selected={selected}
          tagsByDate={tagsByDate}
          onSelectDate={setSelected}
          onPrevMonth={() =>
            setYm((p) => (p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 }))
          }
          onNextMonth={() =>
            setYm((p) => (p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 }))
          }
        />

        {cal.isLoading ? <ActivityIndicator /> : null}

        <View style={styles.card}>
          <Text style={styles.cardDate}>{selected}</Text>
          {selectedDay && selectedDay.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {selectedDay.tags.map((t, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: t.color + '22', borderColor: t.color }]}>
                  <Text style={styles.chipText}>{t.crop} · {t.workType}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.cardEmpty}>이 날에는 작성된 일지가 없습니다.</Text>
          )}
          <Button
            label={selectedDay && selectedDay.tags.length > 0 ? '이 날 일지 보기' : '이 날 일지 작성'}
            variant="secondary"
            onPress={() => router.push({ pathname: '/(tabs)/diary/write', params: { date: selected } })}
            fullWidth
          />
        </View>
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
    paddingVertical: space.md,
  },
  headerTitle: { ...typography.header, color: colors.textPrimary },
  card: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.md, ...shadow.card },
  cardDate: { ...typography.title, color: colors.textPrimary },
  cardEmpty: { ...typography.body, color: colors.textSecondary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: { paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { ...typography.caption, color: colors.textPrimary },
});
