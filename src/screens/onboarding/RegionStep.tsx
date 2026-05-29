import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, space, typography } from '@/ui/tokens';
import { useOnboardingDraft } from '@/state/onboardingDraft';

export function RegionStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const region = useOnboardingDraft((s) => s.region);
  const farmingMethod = useOnboardingDraft((s) => s.farmingMethod);
  const setField = useOnboardingDraft((s) => s.setField);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>지역과 재배 방식</Text>
      <Text style={styles.help}>명함 헤더에 표시됩니다.</Text>

      <TextInput
        label="지역"
        placeholder="충남 논산"
        value={region}
        onChangeText={(v) => setField('region', v)}
      />
      <View style={{ height: space.lg }} />
      <TextInput
        label="재배 방식 (선택)"
        placeholder="친환경 재배"
        value={farmingMethod}
        onChangeText={(v) => setField('farmingMethod', v)}
      />

      <View style={{ flex: 1 }} />
      <View style={styles.row}>
        <Button label="이전" variant="ghost" onPress={onBack} style={{ flex: 1 }} />
        <Button label="다음" onPress={onNext} style={{ flex: 2 }} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.xl, gap: space.md, flexGrow: 1 },
  title: { ...typography.header, color: colors.textPrimary },
  help: { ...typography.caption, color: colors.textSecondary, marginBottom: space.md },
  row: { flexDirection: 'row', gap: space.sm },
});
