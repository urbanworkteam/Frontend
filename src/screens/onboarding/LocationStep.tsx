import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, space, typography } from '@/ui/tokens';
import { useOnboardingDraft } from '@/state/onboardingDraft';

export function LocationStep({
  onSubmit,
  onBack,
  submitting,
}: {
  onSubmit: () => void;
  onBack: () => void;
  submitting?: boolean;
}) {
  const label = useOnboardingDraft((s) => s.locationLabel);
  const address = useOnboardingDraft((s) => s.locationAddress);
  const setField = useOnboardingDraft((s) => s.setField);

  const isValid = !!label.trim() && !!address.trim();

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>농장 위치</Text>
      <Text style={styles.help}>날씨 자동 입력에 사용됩니다. 도로명 주소를 권장합니다.</Text>

      <TextInput
        label="라벨"
        placeholder="1번 농장"
        value={label}
        onChangeText={(v) => setField('locationLabel', v)}
      />
      <View style={{ height: space.lg }} />
      <TextInput
        label="주소"
        placeholder="충남 논산시 연무읍 안심리 123"
        value={address}
        multiline
        onChangeText={(v) => setField('locationAddress', v)}
      />

      <View style={{ flex: 1 }} />
      <View style={styles.row}>
        <Button label="이전" variant="ghost" onPress={onBack} style={{ flex: 1 }} disabled={submitting} />
        <Button label="가입 완료" onPress={onSubmit} disabled={!isValid} loading={submitting} style={{ flex: 2 }} fullWidth />
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
