import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MonthCalendar } from '@/ui/components/MonthCalendar';
import { useDiariesByDate, useDiaryCalendar, useWorkTypes } from '@/api/diary';
import { useAuth } from '@/auth/useAuth';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];
function formatSelectedDate(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 ${KOR_DOW[dt.getDay()]}요일`;
}

export default function DiaryHome() {
  const today = todayStr();
  const [ym, setYm] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [selected, setSelected] = useState<string>(today);
  const cal = useDiaryCalendar(ym.year, ym.month);
  const types = useWorkTypes();
  const user = useAuth((s) => s.user);

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
  const hasDiary = !!(selectedDay && selectedDay.tags.length > 0);

  const dayDiaries = useDiariesByDate(selected, hasDiary);

  const cropsLegend = useMemo(() => {
    const m = new Map<string, string>();
    cal.data?.days.forEach((d) =>
      d.tags.forEach((t) => {
        if (!m.has(t.crop)) m.set(t.crop, t.color);
      }),
    );
    return Array.from(m.entries()).map(([crop, color]) => ({ crop, color }));
  }, [cal.data]);

  const workTypeLabel = (code: string) =>
    types.data?.find((t) => t.code === code)?.label ?? code;
  const workTypeIcon = (code: string) =>
    types.data?.find((t) => t.code === code)?.icon ?? '·';

  const goWrite = () => {
    router.push({ pathname: '/(tabs)/diary/write', params: { date: selected } });
  };

  const goEdit = (id: number) => {
    router.push({ pathname: '/(tabs)/diary/[id]', params: { id: String(id) } });
  };

  const onShare = async () => {
    const handle = user?.handle;
    if (!handle) {
      toast.info('명함 핸들이 설정되지 않았어요');
      return;
    }
    try {
      await Share.share({
        message: `Farmily 명함: https://farmily.info/@${handle}`,
        url: `https://farmily.info/@${handle}`,
      });
    } catch {
      // 사용자 취소 등 — 조용히 무시
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.brand}>Farmily</Text>
        <Pressable style={styles.shareBtn} onPress={onShare} hitSlop={8}>
          <Text style={styles.shareIcon}>↗</Text>
          <Text style={styles.shareText}>공유</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}>
        <MonthCalendar
          year={ym.year}
          month={ym.month}
          selected={selected}
          tagsByDate={tagsByDate}
          onSelectDate={setSelected}
          onPrevMonth={() =>
            setYm((p) =>
              p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 },
            )
          }
          onNextMonth={() =>
            setYm((p) =>
              p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 },
            )
          }
        />

        {cal.isLoading ? <ActivityIndicator /> : null}

        {cropsLegend.length > 0 ? (
          <View style={styles.legendRow}>
            {cropsLegend.map(({ crop, color }) => (
              <View key={crop} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{crop}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.selectedHeader}>
          <Text style={styles.selectedDate}>{formatSelectedDate(selected)}</Text>
          <Pressable style={styles.writeBtn} onPress={goWrite} hitSlop={8}>
            <Text style={styles.writeIcon}>✎</Text>
            <Text style={styles.writeText}>일지 작성</Text>
          </Pressable>
        </View>

        {hasDiary ? (
          dayDiaries.isLoading ? (
            <View style={styles.diaryCard}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            (dayDiaries.data ?? []).map((d) => (
              <View key={d.id} style={styles.diaryCard}>
                <View style={styles.diaryCardTop}>
                  <View style={styles.tagsRow}>
                    <View style={[styles.tag, styles.tagDiary]}>
                      <Text style={styles.tagDiaryText}>🌱 영농일지</Text>
                    </View>
                    {d.workBlocks.map((b) => (
                      <View
                        key={b.id ?? b.workType}
                        style={[styles.tag, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                      >
                        <Text style={[styles.tagText, { color: '#B91C1C' }]}>{workTypeLabel(b.workType)}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable style={styles.editBtn} onPress={() => goEdit(d.id)} hitSlop={6}>
                    <Text style={styles.editText}>편집</Text>
                  </Pressable>
                </View>

                {d.weather ? (
                  <View style={styles.line}>
                    <Text style={styles.lineIcon}>☀</Text>
                    <Text style={styles.lineText}>
                      {d.weather.main ?? '-'} · 최고 {d.weather.tempMax ?? '-'}° 최저{' '}
                      {d.weather.tempMin ?? '-'}°
                    </Text>
                  </View>
                ) : null}
                {d.crop ? (
                  <View style={styles.line}>
                    <Text style={[styles.lineIcon, { color: d.crop.colorHex }]}>●</Text>
                    <Text style={styles.lineText}>작물 {d.crop.name}</Text>
                  </View>
                ) : null}
                {d.workBlocks.map((b) => (
                  <View key={`detail-${b.id ?? b.workType}`} style={styles.line}>
                    <Text style={styles.lineIcon}>{workTypeIcon(b.workType)}</Text>
                    <Text style={styles.lineText}>
                      <Text style={styles.lineBold}>{workTypeLabel(b.workType)}</Text>
                      {b.detail ? ` — ${b.detail}` : ''}
                    </Text>
                  </View>
                ))}
                {d.memo ? (
                  <View style={styles.line}>
                    <Text style={styles.lineIcon}>💬</Text>
                    <Text style={styles.lineText}>{d.memo}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>이 날에는 작성된 일지가 없습니다.</Text>
          </View>
        )}
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
  brand: { ...typography.header, color: colors.textPrimary },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  shareIcon: { fontSize: 14, color: colors.textPrimary, lineHeight: 16 },
  shareText: { ...typography.bodyBold, color: colors.textPrimary },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingHorizontal: space.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { ...typography.caption, color: colors.textSecondary },

  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  selectedDate: { ...typography.title, color: colors.textPrimary },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  writeIcon: { fontSize: 14, color: colors.textPrimary },
  writeText: { ...typography.bodyBold, color: colors.textPrimary },

  diaryCard: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  diaryCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, flex: 1 },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tagDiary: { backgroundColor: '#DCFCE7', borderColor: colors.primary },
  tagDiaryText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  tagText: { ...typography.caption, fontWeight: '600' },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    backgroundColor: colors.surface,
  },
  editText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },

  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginTop: 2 },
  lineIcon: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, width: 16 },
  lineText: { ...typography.body, color: colors.textPrimary, flex: 1, lineHeight: 20 },
  lineBold: { ...typography.bodyBold, color: colors.textPrimary },

  emptyCard: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
