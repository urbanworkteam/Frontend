import React, { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/ui/components/Button';
import { colors, radius, space, typography } from '@/ui/tokens';

const { width: SW } = Dimensions.get('window');

const PAGES = [
  {
    emoji: '🌱',
    title: '나만의 농장 명함',
    desc: '농장 정보와 재배 스토리를 한 페이지에. 소비자에게 공유하세요.',
  },
  {
    emoji: '📔',
    title: '영농일지로 기록',
    desc: '오늘 한 일을 가볍게 적으면 달력과 명함에 자동 반영됩니다.',
  },
  {
    emoji: '✨',
    title: 'AI 콘텐츠 생성',
    desc: '일지를 기반으로 인스타그램 카드뉴스나 스마트스토어 상세를 자동 생성.',
  },
];

export function GuideStep({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / SW));
  };

  const next = () => {
    if (page < PAGES.length - 1) {
      scrollRef.current?.scrollTo({ x: SW * (page + 1), animated: true });
    } else {
      onDone();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {PAGES.map((p, i) => (
          <View key={i} style={[styles.page, { width: SW }]}>
            <Text style={styles.emoji}>{p.emoji}</Text>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.desc}>{p.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
        ))}
      </View>

      <View style={{ padding: space.xl }}>
        <Button label={page === PAGES.length - 1 ? '시작하기' : '다음'} onPress={next} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md },
  emoji: { fontSize: 80 },
  title: { ...typography.header, color: colors.textPrimary, textAlign: 'center' },
  desc: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: space.sm },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, paddingVertical: space.md },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
});
