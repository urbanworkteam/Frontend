import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFarmLocations, useCreateFarmLocation, useDeleteFarmLocation } from '@/api/farmLocation';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function LocationsManageScreen() {
  const locs = useFarmLocations();
  const create = useCreateFarmLocation();
  const del = useDeleteFarmLocation();
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');

  const add = () => {
    if (!label.trim() || !address.trim()) return;
    create.mutate(
      { label, address },
      {
        onSuccess: () => {
          setLabel('');
          setAddress('');
          toast.success('농장 위치가 추가되었습니다');
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← 뒤로</Text></Pressable>
        <Text style={styles.title}>농장 위치</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <View style={[styles.card, { gap: space.sm }]}>
          <TextInput label="라벨" value={label} onChangeText={setLabel} placeholder="2번 농장" />
          <TextInput label="주소" value={address} onChangeText={setAddress} placeholder="도로명 주소" />
          <Button label="추가" onPress={add} disabled={!label.trim() || !address.trim()} loading={create.isPending} fullWidth />
        </View>

        {locs.isLoading ? <ActivityIndicator /> : null}
        {(locs.data ?? []).map((l) => (
          <View key={l.id} style={styles.card}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardLabel}>{l.label}</Text>
              <Text style={styles.cardAddress}>{l.address}</Text>
              {l.kmaGridX !== null ? (
                <Text style={styles.cardMeta}>격자: ({l.kmaGridX}, {l.kmaGridY})</Text>
              ) : (
                <Text style={[styles.cardMeta, { color: colors.warning }]}>지오코딩 실패 — 날씨 자동 입력 불가</Text>
              )}
            </View>
            <Pressable onPress={() => del.mutate(l.id)} hitSlop={8}>
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
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, padding: space.md, borderRadius: radius.md, ...shadow.card },
  cardLabel: { ...typography.bodyBold, color: colors.textPrimary },
  cardAddress: { ...typography.caption, color: colors.textSecondary },
  cardMeta: { ...typography.small, color: colors.textTertiary },
  delete: { ...typography.caption, color: colors.danger, paddingLeft: space.md },
});
