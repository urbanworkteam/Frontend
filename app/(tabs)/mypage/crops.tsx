import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCrops, useCreateCrop, useDeleteCrop } from '@/api/crop';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function CropsManageScreen() {
  const crops = useCrops();
  const create = useCreateCrop();
  const del = useDeleteCrop();
  const [name, setName] = useState('');

  const add = () => {
    const n = name.trim();
    if (!n) return;
    create.mutate({ name: n }, {
      onSuccess: () => setName(''),
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← 뒤로</Text></Pressable>
        <Text style={styles.title}>재배 작물</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <View style={styles.row}>
          <TextInput value={name} onChangeText={setName} placeholder="딸기" style={{ flex: 1 }} onSubmitEditing={add} returnKeyType="done" />
          <Button label="추가" onPress={add} disabled={!name.trim()} loading={create.isPending} />
        </View>

        {crops.isLoading ? <ActivityIndicator /> : null}
        {(crops.data ?? []).map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={[styles.dot, { backgroundColor: c.colorHex }]} />
            <Text style={styles.cardName}>{c.name}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => del.mutate(c.id)} hitSlop={8}>
              <Text style={styles.delete}>삭제</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, padding: space.md, borderRadius: radius.md, ...shadow.card },
  dot: { width: 12, height: 12, borderRadius: radius.pill },
  cardName: { ...typography.body, color: colors.textPrimary },
  delete: { ...typography.caption, color: colors.danger },
});
