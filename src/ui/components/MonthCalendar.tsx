import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, typography } from '../tokens';

export type Tag = { color: string };

type Props = {
  year: number;
  month: number; // 1-12
  selected: string | null;
  tagsByDate: Record<string, Tag[]>;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function MonthCalendar({ year, month, selected, tagsByDate, onSelectDate, onPrevMonth, onNextMonth }: Props) {
  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();
    const startWeekday = first.getDay();
    const arr: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= lastDay; d++) {
      arr.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} hitSlop={12}><Text style={styles.nav}>‹</Text></Pressable>
        <Text style={styles.title}>{year}년 {month}월</Text>
        <Pressable onPress={onNextMonth} hitSlop={12}><Text style={styles.nav}>›</Text></Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={w} style={[styles.weekday, i === 0 && { color: colors.danger }, i === 6 && { color: colors.info }]}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const tags = tagsByDate[d] ?? [];
          const sel = selected === d;
          const day = parseInt(d.split('-')[2], 10);
          const weekdayIdx = i % 7;
          return (
            <Pressable key={d} style={styles.cell} onPress={() => onSelectDate(d)}>
              <View style={[styles.dayCircle, sel && styles.daySelected]}>
                <Text
                  style={[
                    styles.dayText,
                    sel && { color: '#fff' },
                    !sel && weekdayIdx === 0 && { color: colors.danger },
                    !sel && weekdayIdx === 6 && { color: colors.info },
                  ]}
                >
                  {day}
                </Text>
              </View>
              <View style={styles.tags}>
                {tags.slice(0, 3).map((t, j) => (
                  <View key={j} style={[styles.dot, { backgroundColor: t.color }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm, paddingBottom: space.sm },
  title: { ...typography.title, color: colors.textPrimary },
  nav: { fontSize: 24, color: colors.textPrimary, paddingHorizontal: space.md },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', ...typography.caption, color: colors.textSecondary, paddingVertical: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.primary },
  dayText: { ...typography.body, color: colors.textPrimary },
  tags: { flexDirection: 'row', gap: 3, marginTop: 2, minHeight: 6 },
  dot: { width: 5, height: 5, borderRadius: radius.pill },
});
