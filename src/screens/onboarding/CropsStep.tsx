import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, space, typography } from '@/ui/tokens';
import { useOnboardingDraft } from '@/state/onboardingDraft';

export function CropsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const crops = useOnboardingDraft((s) => s.crops);
  const addCrop = useOnboardingDraft((s) => s.addCrop);
  const removeCrop = useOnboardingDraft((s) => s.removeCrop);
  const [text, setText] = useState('');

  const add = () => {
    const t = text.trim();
    if (!t) return;
    addCrop(t);
    setText('');
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>재배 작물을 알려주세요</Text>
      <Text style={styles.help}>1개 이상 입력해주세요. 나중에 마이페이지에서 추가/삭제 가능합니다.</Text>

      <View style={styles.row}>
        <TextInput
          placeholder="딸기"
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          returnKeyType="done"
          style={{ flex: 1 }}
        />
        <Button label="추가" onPress={add} disabled={!text.trim()} />
      </View>

      <View style={styles.list}>
        {crops.map((c) => (
          <View key={c.name} style={styles.chip}>
            <Text style={styles.chipText}>{c.name}</Text>
            <Pressable onPress={() => removeCrop(c.name)}>
              <Text style={styles.chipClose}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <View style={styles.actions}>
        <Button label="이전" variant="ghost" onPress={onBack} style={{ flex: 1 }} />
        <Button label="다음" onPress={onNext} disabled={crops.length === 0} style={{ flex: 2 }} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.xl, gap: space.md, flexGrow: 1 },
  title: { ...typography.header, color: colors.textPrimary },
  help: { ...typography.caption, color: colors.textSecondary, marginBottom: space.md },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.primaryDim,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.bodyBold, color: colors.primaryDark },
  chipClose: { ...typography.title, color: colors.primaryDark },
  actions: { flexDirection: 'row', gap: space.sm },
});
