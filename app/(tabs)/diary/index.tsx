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
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MonthCalendar } from '@/ui/components/MonthCalendar';
import { useDiariesByDate, useDiaryCalendar, useWorkTypes } from '@/api/diary';
import type { DiaryResponse } from '@/types/diary';
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
  const [viewDiary, setViewDiary] = useState<DiaryResponse | null>(null);
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
                      <Text style={styles.tagDiaryText}>영농일지</Text>
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
                  <View style={styles.cardBtns}>
                    <Pressable style={styles.viewBtn} onPress={() => setViewDiary(d)} hitSlop={6}>
                      <Text style={styles.viewBtnText}>보기</Text>
                    </Pressable>
                    <Pressable style={styles.editBtn} onPress={() => goEdit(d.id)} hitSlop={6}>
                      <Text style={styles.editText}>편집</Text>
                    </Pressable>
                  </View>
                </View>

                {d.crop ? (
                  <View style={styles.line}>
                    <View style={[styles.cropDot, { backgroundColor: d.crop.colorHex }]} />
                    <Text style={styles.lineLabel}>작물</Text>
                    <Text style={styles.lineText}>{d.crop.name}</Text>
                  </View>
                ) : null}
                {d.weather ? (
                  <View style={styles.line}>
                    <Ionicons name="partly-sunny-outline" size={14} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>날씨</Text>
                    <Text style={styles.lineText}>
                      {d.weather.main ?? '-'} · {d.weather.tempMax ?? '-'}° / {d.weather.tempMin ?? '-'}°
                    </Text>
                  </View>
                ) : null}
                {d.workBlocks.map((b) => (
                  <View key={`detail-${b.id ?? b.workType}`} style={styles.line}>
                    <Ionicons name="leaf-outline" size={14} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>{workTypeLabel(b.workType)}</Text>
                    <Text style={styles.lineText} numberOfLines={1}>
                      {b.detail || '-'}
                    </Text>
                  </View>
                ))}
                {d.memo ? (
                  <View style={styles.line}>
                    <Ionicons name="document-text-outline" size={14} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>메모</Text>
                    <Text style={styles.lineText} numberOfLines={1}>{d.memo}</Text>
                  </View>
                ) : null}
                {d.photos && d.photos.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                    {d.photos.map((p) => (
                      <Image key={p.id} source={{ uri: p.url }} style={styles.photoThumb} />
                    ))}
                  </ScrollView>
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

      {/* 일지 보기 모달 */}
      {viewDiary ? (
        <Pressable style={styles.modalOverlay} onPress={() => setViewDiary(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formatSelectedDate(viewDiary.date)} 영농일지</Text>
              <Pressable onPress={() => setViewDiary(null)} hitSlop={8}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBodyScroll}>
              {viewDiary.photos && viewDiary.photos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalPhotoRow}>
                  {viewDiary.photos.map((p) => (
                    <Image key={p.id} source={{ uri: p.url }} style={styles.modalPhoto} contentFit="cover" />
                  ))}
                </ScrollView>
              ) : null}

              <View style={styles.modalBody}>
                {viewDiary.weather ? (
                  <View style={styles.modalLine}>
                    <Text style={styles.modalLabel}>날씨</Text>
                    <Text style={styles.modalValue}>
                      {viewDiary.weather.main ?? '-'} · {viewDiary.weather.tempMax ?? '-'}° / {viewDiary.weather.tempMin ?? '-'}°
                    </Text>
                  </View>
                ) : null}
                {viewDiary.crop ? (
                  <View style={styles.modalLine}>
                    <Text style={styles.modalLabel}>작물</Text>
                    <Text style={styles.modalValue}>{viewDiary.crop.name}</Text>
                  </View>
                ) : null}
                {viewDiary.workBlocks.map((b) => (
                  <View key={`modal-${b.id ?? b.workType}`} style={styles.modalLine}>
                    <Text style={styles.modalLabel}>{workTypeLabel(b.workType)}</Text>
                    <Text style={styles.modalValue}>{b.detail || '-'}</Text>
                  </View>
                ))}
                {viewDiary.memo ? (
                  <View style={styles.modalLine}>
                    <Text style={styles.modalLabel}>메모</Text>
                    <Text style={styles.modalValue}>{viewDiary.memo}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <Pressable style={styles.modalCloseBtn} onPress={() => setViewDiary(null)}>
              <Text style={styles.modalCloseBtnText}>닫기</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      ) : null}
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
    height: 52,
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { ...typography.bodyBold, color: colors.textPrimary },
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

  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  lineIconStyle: { width: 20, textAlign: 'center' },
  lineLabel: { ...typography.caption, color: colors.textTertiary, width: 36, lineHeight: 20 },
  cropDot: { width: 14, height: 14, borderRadius: 7, marginLeft: 3, marginRight: 3 },
  lineText: { ...typography.body, color: colors.textPrimary, flex: 1, lineHeight: 20 },

  emptyCard: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: { ...typography.body, color: colors.textSecondary },

  photoRow: { marginTop: space.sm },
  photoThumb: { width: 80, height: 80, borderRadius: 8, marginRight: space.sm },

  cardBtns: { flexDirection: 'row', gap: space.xs },
  viewBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    backgroundColor: '#E6F4EA',
  },
  viewBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  // 모달
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.title, color: colors.textPrimary },
  modalClose: { fontSize: 20, color: colors.textTertiary },
  modalPhotoRow: { padding: space.md, overflow: 'visible' },
  modalPhoto: { width: 240, height: 180, borderRadius: 8, marginRight: space.sm, overflow: 'hidden' },
  modalBody: { padding: space.lg, gap: space.md },
  modalBodyScroll: { flex: 1 },
  modalLine: { flexDirection: 'row', gap: space.md },
  modalLabel: { ...typography.caption, color: colors.textSecondary, width: 50 },
  modalValue: { ...typography.body, color: colors.textPrimary, flex: 1 },
  modalCloseBtn: {
    margin: space.lg,
    marginTop: 0,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  modalCloseBtnText: { ...typography.bodyBold, color: colors.textPrimary },
});
