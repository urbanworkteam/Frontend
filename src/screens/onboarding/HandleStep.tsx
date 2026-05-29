import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, space, typography } from '@/ui/tokens';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { checkHandle } from '@/api/auth';
import { Pressable } from 'react-native';

export function HandleStep({ onNext }: { onNext: () => void }) {
  const handle = useOnboardingDraft((s) => s.handle);
  const setField = useOnboardingDraft((s) => s.setField);
  const farmDisplayName = useOnboardingDraft((s) => s.farmDisplayName);
  const [check, setCheck] = useState<{ available: boolean | null; suggestions: string[] }>({
    available: null,
    suggestions: [],
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!handle) {
      setCheck({ available: null, suggestions: [] });
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await checkHandle(handle);
        setCheck(res);
      } catch {
        setCheck({ available: null, suggestions: [] });
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [handle]);

  const isValid =
    !!handle.match(/^[a-z0-9-]{3,30}$/) && !!farmDisplayName.trim() && check.available === true;

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>농장 이름을 알려주세요</Text>
      <Text style={styles.help}>나만의 농장 URL 이 됩니다: farmily.kr/@{handle || 'your-handle'}</Text>

      <TextInput
        label="농장 표시명 (한글)"
        placeholder="강씨네 딸기농장"
        value={farmDisplayName}
        onChangeText={(v) => setField('farmDisplayName', v)}
        maxLength={50}
      />

      <View style={{ height: space.lg }} />

      <TextInput
        label="handle (영문/숫자/하이픈 3-30자)"
        placeholder="kang-strawberry"
        value={handle}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(v) => setField('handle', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        error={
          handle && !handle.match(/^[a-z0-9-]{3,30}$/)
            ? '영문/숫자/하이픈 3-30자만 가능'
            : check.available === false
              ? '이미 사용 중입니다'
              : null
        }
        hint={
          checking
            ? '확인 중...'
            : check.available === true
              ? '사용 가능합니다 ✓'
              : '닉네임에서 영문 후보가 자동 제안됩니다'
        }
      />

      {check.suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestLabel}>추천:</Text>
          {check.suggestions.map((s) => (
            <Pressable key={s} onPress={() => setField('handle', s)} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ flex: 1 }} />
      <Button label="다음" onPress={onNext} disabled={!isValid} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.xl, gap: space.md, flexGrow: 1 },
  title: { ...typography.header, color: colors.textPrimary },
  help: { ...typography.caption, color: colors.textSecondary, marginBottom: space.md },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
  suggestLabel: { ...typography.caption, color: colors.textSecondary, marginRight: space.xs, alignSelf: 'center' },
  chip: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.caption, color: colors.textPrimary },
});
