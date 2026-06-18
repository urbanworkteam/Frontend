import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthCalendar } from '@/ui/components/MonthCalendar';
import { useProfileCalendar } from '@/api/profile';
import { useWorkTypes } from '@/api/diary';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

export default function ProfileCalendarScreen() {
  const [ym, setYm] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [selected, setSelected] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const cal = useProfileCalendar(ym.year, ym.month);
  const types = useWorkTypes();

  const tagsByDate = useMemo(() => {
    const m: Record<string, { color: string; label: string }[]> = {};
    cal.data?.days.forEach((d) =>
      (m[d.date] = d.tags.map((t) => ({
        color: t.color,
        label: types.data?.find((type) => type.code === t.workType)?.label ?? t.workType,
      }))),
    );
    return m;
  }, [cal.data, types.data]);

  const selDay = cal.data?.days.find((d) => d.date === selected);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>명함 달력</Text>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <MonthCalendar
          year={ym.year}
          month={ym.month}
          selected={selected}
          tagsByDate={tagsByDate}
          tagDisplay="chips"
          onSelectDate={setSelected}
          onPrevMonth={() =>
            setYm((p) => (p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 }))
          }
          onNextMonth={() =>
            setYm((p) => (p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 }))
          }
        />
        <View style={styles.card}>
          <Text style={styles.cardDate}>{selected}</Text>
          {selDay && selDay.tags.length ? (
            selDay.tags.map((t, i) => (
              <Text key={i} style={styles.tag}>· {t.crop} ({t.workType})</Text>
            ))
          ) : (
            <Text style={styles.empty}>일지 없음</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  title: { ...typography.header, color: colors.textPrimary, padding: space.lg },
  card: { backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, gap: space.xs, ...shadow.card },
  cardDate: { ...typography.title, color: colors.textPrimary },
  tag: { ...typography.body, color: colors.textPrimary },
  empty: { ...typography.body, color: colors.textSecondary },
});
