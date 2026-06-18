import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMyProfile, useProfileCalendar, type SalesChannelCode } from '@/api/profile';
import { useDiariesByDate, useWorkTypes } from '@/api/diary';
import type { DiaryResponse } from '@/types/diary';
import { useAuth } from '@/auth/useAuth';
import { MonthCalendar } from '@/ui/components/MonthCalendar';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

const CHANNEL_ICONS = {
  SMARTSTORE: require('../../../assets/icons/smartstore.png'),
  INSTAGRAM: require('../../../assets/icons/instagram.png'),
  DAANGN: require('../../../assets/icons/daangn.png'),
} as const;

const CHANNEL_META: Record<SalesChannelCode, { label: string }> = {
  SMARTSTORE: { label: '스마트스토어' },
  INSTAGRAM: { label: '인스타그램' },
  DAANGN: { label: '당근' },
};

const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];
function formatSelectedDate(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 ${KOR_DOW[dt.getDay()]}요일 · 영농일지`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MyProfileScreen() {
  const profile = useMyProfile();
  const user = useAuth((s) => s.user);
  const types = useWorkTypes();
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [selected, setSelected] = useState<string>(todayStr());
  const [viewDiary, setViewDiary] = useState<DiaryResponse | null>(null);
  const cal = useProfileCalendar(ym.year, ym.month);

  const workTypeLabelByCode = useMemo(
    () => new Map<string, string>((types.data ?? []).map((t) => [t.code, t.label])),
    [types.data],
  );

  const tagsByDate = useMemo(() => {
    const m: Record<string, { color: string; label: string }[]> = {};
    cal.data?.days.forEach((d) => {
      m[d.date] = d.tags.map((t) => ({
        color: t.color,
        label: workTypeLabelByCode.get(t.workType) ?? t.workType,
      }));
    });
    return m;
  }, [cal.data, workTypeLabelByCode]);

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

  function workTypeLabel(code: string) {
    return workTypeLabelByCode.get(code) ?? code;
  }

  if (profile.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const p = profile.data;
  const farmName = p?.farm.farmName ?? '농장명 미설정';
  const initial = farmName.charAt(0);
  const region = p?.farm.region ?? '';
  const method = p?.farm.farmingMethod ?? '';
  const handle = user?.handle ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarHandle}>{handle ? `farmily.info/@${handle}` : 'Farmily'}</Text>
        <Pressable style={styles.editBtn} onPress={() => router.push('/(tabs)/profile/edit')} hitSlop={8}>
          <Text style={styles.editBtnText}>명함 편집</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View style={styles.headerBg}>
          {p?.farm.backgroundImageUrl ? (
            <Image
              source={{ uri: p.farm.backgroundImageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.bgPlaceholder}>배경 사진</Text>
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              {p?.farm.avatarImageUrl ? (
                <Image
                  source={{ uri: p.farm.avatarImageUrl }}
                  style={{ width: 88, height: 88, borderRadius: 44 }}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{initial}</Text>
              )}
            </View>
          </View>
          <Text style={styles.farmName}>{farmName}</Text>
          <View style={styles.nameDivider} />
          {region ? (
            <Text style={styles.regionText}>{region}</Text>
          ) : null}
          {method ? (
            <Text style={styles.methodText}>{method}</Text>
          ) : null}

          {(p?.salesChannels?.length ?? 0) > 0 ? (
            <View style={styles.channelRow}>
              {p!.salesChannels.map((c) => {
                const meta = CHANNEL_META[c.channel] ?? { label: c.channel };
                return (
                  <Pressable
                    key={c.id}
                    style={styles.channelChip}
                    onPress={() => Linking.openURL(c.url).catch(() => {})}
                    hitSlop={4}
                  >
                    <Image source={CHANNEL_ICONS[c.channel]} style={styles.channelIconImg} />
                    <Text style={styles.channelText}>{meta.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.calendarBox}>
          <MonthCalendar
            year={ym.year}
            month={ym.month}
            selected={selected}
            tagsByDate={tagsByDate}
            tagDisplay="chips"
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
        </View>

        {hasDiary ? (
          dayDiaries.isLoading ? (
            <View style={styles.dayCard}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            (dayDiaries.data ?? []).map((d) => (
              <View key={d.id} style={styles.dayCard}>
                {/* 사진 */}
                {d.photos && d.photos.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPhotoRow}>
                    {d.photos.map((p) => (
                      <Image key={p.id} source={{ uri: p.url }} style={styles.dayPhoto} contentFit="cover" />
                    ))}
                  </ScrollView>
                ) : null}

                {/* 헤더: 날짜 + 보기 버튼 */}
                <View style={styles.dayCardHeader}>
                  <Text style={styles.dayCardTitle}>{formatSelectedDate(selected)}</Text>
                  <Pressable style={styles.viewBtn} onPress={() => setViewDiary(d)} hitSlop={6}>
                    <Text style={styles.viewBtnText}>보기</Text>
                  </Pressable>
                </View>

                {d.crop ? (
                  <View style={styles.line}>
                    <View style={[styles.cropDot, { backgroundColor: d.crop.colorHex }]} />
                    <Text style={styles.lineLabel}>작물</Text>
                    <Text style={styles.lineText} numberOfLines={1}>{d.crop.name}</Text>
                  </View>
                ) : null}
                {d.weather ? (
                  <View style={styles.line}>
                    <Ionicons name="partly-sunny-outline" size={16} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>날씨</Text>
                    <Text style={styles.lineText} numberOfLines={1}>
                      {d.weather.main ?? '-'} · {d.weather.tempMax ?? '-'}° / {d.weather.tempMin ?? '-'}°
                    </Text>
                  </View>
                ) : null}
                {d.workBlocks.map((b) => (
                  <View key={`work-${b.id ?? b.workType}`} style={styles.line}>
                    <Ionicons name="leaf-outline" size={16} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>{workTypeLabel(b.workType)}</Text>
                    <Text style={styles.lineText} numberOfLines={1}>{b.detail || '-'}</Text>
                  </View>
                ))}
                {d.memo ? (
                  <View style={styles.line}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>메모</Text>
                    <Text style={styles.lineText} numberOfLines={1}>{d.memo}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )
        ) : null}

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
            <ScrollView style={{ flex: 1 }}>
              {viewDiary.photos && viewDiary.photos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: space.md }}>
                  {viewDiary.photos.map((p) => (
                    <Image key={p.id} source={{ uri: p.url }} style={{ width: 220, height: 160, borderRadius: 8, marginRight: space.sm }} contentFit="cover" />
                  ))}
                </ScrollView>
              ) : null}
              <View style={{ padding: space.lg, gap: space.md }}>
                {viewDiary.crop ? (
                  <View style={styles.line}>
                    <View style={[styles.cropDot, { backgroundColor: viewDiary.crop.colorHex }]} />
                    <Text style={styles.lineLabel}>작물</Text>
                    <Text style={styles.lineText}>{viewDiary.crop.name}</Text>
                  </View>
                ) : null}
                {viewDiary.weather ? (
                  <View style={styles.line}>
                    <Ionicons name="partly-sunny-outline" size={16} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>날씨</Text>
                    <Text style={styles.lineText}>{viewDiary.weather.main ?? '-'} · {viewDiary.weather.tempMax ?? '-'}° / {viewDiary.weather.tempMin ?? '-'}°</Text>
                  </View>
                ) : null}
                {viewDiary.workBlocks.map((b) => (
                  <View key={`m-${b.id ?? b.workType}`} style={styles.line}>
                    <Ionicons name="leaf-outline" size={16} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>{workTypeLabel(b.workType)}</Text>
                    <Text style={styles.lineText}>{b.detail || '-'}</Text>
                  </View>
                ))}
                {viewDiary.memo ? (
                  <View style={styles.line}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textTertiary} style={styles.lineIconStyle} />
                    <Text style={styles.lineLabel}>메모</Text>
                    <Text style={styles.lineText}>{viewDiary.memo}</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    height: 52,
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  topBarHandle: { ...typography.bodyBold, color: colors.textPrimary },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  editBtnText: { ...typography.bodyBold, color: colors.textPrimary },

  headerBg: {
    height: 180,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgPlaceholder: { ...typography.body, color: colors.primary, opacity: 0.6 },

  headerInfo: { alignItems: 'center', marginTop: -52, paddingBottom: space.lg, gap: space.xs },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.primary },
  farmName: { ...typography.header, fontSize: 22, color: colors.textPrimary, marginTop: space.md, textAlign: 'center', letterSpacing: -0.3 },
  nameDivider: { width: 32, height: 2, backgroundColor: colors.primary, borderRadius: 1, marginTop: space.sm },
  regionText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: space.sm, lineHeight: 20 },
  methodText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: 4 },

  channelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    justifyContent: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.lg,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  channelIconImg: { width: 16, height: 16, borderRadius: 3 },
  channelText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },

  calendarBox: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    ...shadow.card,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { ...typography.caption, color: colors.textSecondary },

  dayCard: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    gap: space.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  dayCardTitle: { ...typography.title, color: colors.textPrimary, marginBottom: space.xs },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  lineIconStyle: { width: 20, textAlign: 'center' },
  lineLabel: { ...typography.caption, color: colors.textTertiary, width: 36 },
  cropDot: { width: 14, height: 14, borderRadius: 7, marginLeft: 3, marginRight: 3 },
  lineText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  workTag: {
    paddingVertical: 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginLeft: space.xs,
  },
  workTagText: { ...typography.caption, fontWeight: '600' },

  dayPhotoRow: { marginBottom: space.sm },
  dayPhoto: { width: 120, height: 90, borderRadius: 8, marginRight: space.xs },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xs },
  viewBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    backgroundColor: '#E6F4EA',
  },
  viewBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
  modalTitle: { ...typography.bodyBold, color: colors.textPrimary },
  modalClose: { fontSize: 20, color: colors.textTertiary },
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
