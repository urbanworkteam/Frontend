import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMyProfile, useUpdateProfile, useReorderBlocks, useDeleteBlock, useAddTextBlock, SalesChannelCode } from '@/api/profile';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

const CHANNELS: SalesChannelCode[] = ['SMARTSTORE', 'INSTAGRAM', 'DAANGN'];

export default function ProfileEditScreen() {
  const profile = useMyProfile();
  const update = useUpdateProfile();
  const reorder = useReorderBlocks();
  const addText = useAddTextBlock();
  const deleteBlock = useDeleteBlock();

  const [farmName, setFarmName] = useState('');
  const [region, setRegion] = useState('');
  const [farmingMethod, setFarmingMethod] = useState('');
  const [story, setStory] = useState('');
  const [channels, setChannels] = useState<{ channel: SalesChannelCode; url: string }[]>([]);

  useEffect(() => {
    if (!profile.data) return;
    const f = profile.data.farm;
    setFarmName(f.farmName ?? '');
    setRegion(f.region ?? '');
    setFarmingMethod(f.farmingMethod ?? '');
    setStory(f.story.text ?? '');
    setChannels(profile.data.salesChannels.map((c) => ({ channel: c.channel, url: c.url })));
  }, [profile.data]);

  const save = () => {
    update.mutate(
      {
        farm: { farmName, region, farmingMethod },
        story: { text: story },
        salesChannels: channels.filter((c) => c.url.trim()),
      },
      {
        onSuccess: () => {
          toast.success('저장되었습니다');
          router.back();
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const toggleVisible = (blockId: number) => {
    if (!profile.data) return;
    const blocks = profile.data.blocks.map((b) =>
      b.id === blockId
        ? { id: b.id, sortOrder: b.sortOrder, visible: !b.visible, payload: b.payload }
        : { id: b.id, sortOrder: b.sortOrder, visible: b.visible, payload: b.payload },
    );
    reorder.mutate(blocks);
  };

  if (profile.isLoading || !profile.data) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← 취소</Text></Pressable>
        <Text style={styles.title}>명함 편집</Text>
        <Pressable onPress={save}><Text style={styles.submit}>저장</Text></Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
          <Section title="기본 정보">
            <TextInput label="농장 이름" value={farmName} onChangeText={setFarmName} maxLength={50} />
            <TextInput label="지역" value={region} onChangeText={setRegion} maxLength={50} />
            <TextInput label="재배 방식" value={farmingMethod} onChangeText={setFarmingMethod} maxLength={100} />
          </Section>

          <Section title="재배 스토리">
            <TextInput
              value={story}
              onChangeText={setStory}
              placeholder="작물에 담긴 정성과 이야기..."
              multiline
              maxLength={5000}
              hint={`${story.length}/5000`}
            />
          </Section>

          <Section title="판매처">
            {CHANNELS.map((code) => {
              const found = channels.find((c) => c.channel === code);
              return (
                <TextInput
                  key={code}
                  label={code}
                  value={found?.url ?? ''}
                  onChangeText={(v) => {
                    setChannels((arr) => {
                      const filtered = arr.filter((c) => c.channel !== code);
                      return v.trim() ? [...filtered, { channel: code, url: v }] : filtered;
                    });
                  }}
                  placeholder="https://..."
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              );
            })}
          </Section>

          <Section title="명함 블록">
            {profile.data.blocks.map((b) => (
              <View key={b.id} style={styles.blockRow}>
                <Text style={styles.blockLabel}>{b.blockType}</Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => toggleVisible(b.id)}
                  style={[styles.toggle, b.visible ? styles.toggleOn : styles.toggleOff]}
                >
                  <Text style={[styles.toggleText, b.visible ? { color: '#fff' } : { color: colors.textSecondary }]}>
                    {b.visible ? '노출' : '숨김'}
                  </Text>
                </Pressable>
                {b.blockType === 'TEXT' ? (
                  <Pressable onPress={() => deleteBlock.mutate(b.id)} style={{ marginLeft: space.xs }}>
                    <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Button
              label="+ 텍스트 블록 추가"
              variant="secondary"
              onPress={() => addText.mutate({ body: '' })}
              fullWidth
            />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  submit: { ...typography.bodyBold, color: colors.primary },
  section: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, gap: space.md, ...shadow.card },
  sectionTitle: { ...typography.title, color: colors.textPrimary },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  blockLabel: { ...typography.body, color: colors.textPrimary },
  toggle: { paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill },
  toggleOn: { backgroundColor: colors.primary },
  toggleOff: { backgroundColor: colors.surfaceMuted },
  toggleText: { ...typography.caption },
});
