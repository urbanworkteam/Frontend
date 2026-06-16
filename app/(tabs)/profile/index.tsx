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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMyProfile, useProfileCalendar, type SalesChannelCode } from '@/api/profile';
import { useDiariesByDate, useWorkTypes } from '@/api/diary';
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
  const cal = useProfileCalendar(ym.year, ym.month);

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
          <Text style={styles.editBtnText}>✎ 명함 편집</Text>
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
            <Text style={styles.bgPlaceholder}>🖼 배경 사진</Text>
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            {p?.farm.avatarImageUrl ? (
              <Image
                source={{ uri: p.farm.avatarImageUrl }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.farmName}>{farmName}</Text>
          {(region || method) ? (
            <Text style={styles.region}>
              {[region, method].filter(Boolean).join(' · ')}
            </Text>
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
                <Text style={styles.dayCardTitle}>{formatSelectedDate(selected)}</Text>
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
                    <Text style={styles.lineText}>{d.crop.name}</Text>
                    <View style={[styles.workTag, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                      <Text style={[styles.workTagText, { color: '#B91C1C' }]}>
                        {workTypeLabel(d.workBlocks[0]?.workType ?? '')}
                      </Text>
                    </View>
                  </View>
                ) : null}
                {d.memo ? (
                  <View style={styles.line}>
                    <Text style={styles.lineIcon}>💬</Text>
                    <Text style={styles.lineText}>{d.memo}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )
        ) : null}

        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>🌱 Farmily로 만든 농가 명함 — 가입하기 →</Text>
        </View>
      </ScrollView>
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
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  topBarHandle: { ...typography.body, color: colors.textSecondary },
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
    height: 140,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgPlaceholder: { ...typography.body, color: colors.primary, opacity: 0.6 },

  headerInfo: { alignItems: 'center', marginTop: -48, paddingBottom: space.lg, gap: space.xs },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadow.card,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.primary },
  farmName: { ...typography.header, color: colors.textPrimary, marginTop: space.sm, textAlign: 'center' },
  region: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },

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
  lineIcon: { fontSize: 14, color: colors.textSecondary, width: 16 },
  lineText: { ...typography.body, color: colors.textPrimary },
  workTag: {
    paddingVertical: 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginLeft: space.xs,
  },
  workTagText: { ...typography.caption, fontWeight: '600' },

  watermark: {
    marginHorizontal: space.lg,
    marginTop: space.lg,
    padding: space.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  watermarkText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
