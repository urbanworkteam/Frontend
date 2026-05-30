import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/ui/components/Button';
import { colors, radius, space, typography } from '@/ui/tokens';

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
  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  const next = () => {
    if (isLast) onDone();
    else setPage(page + 1);
  };

  const prev = () => {
    if (page > 0) setPage(page - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.page}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.desc}</Text>
      </View>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <Pressable key={i} onPress={() => setPage(i)} hitSlop={8}>
            <View style={[styles.dot, page === i && styles.dotActive]} />
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        {page > 0 ? (
          <Button label="이전" variant="ghost" onPress={prev} style={{ flex: 1 }} />
        ) : null}
        <Button
          label={isLast ? '시작하기' : '다음 →'}
          onPress={next}
          style={{ flex: page > 0 ? 2 : 1 }}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
    gap: space.md,
  },
  emoji: { fontSize: 80 },
  title: { ...typography.header, color: colors.textPrimary, textAlign: 'center' },
  desc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.lg,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, paddingVertical: space.md },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  actions: { flexDirection: 'row', gap: space.sm, padding: space.xl },
});
