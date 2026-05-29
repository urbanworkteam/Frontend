import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMyPage, useUpdateAccount } from '@/api/mypage';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function AccountEditScreen() {
  const mp = useMyPage();
  const update = useUpdateAccount();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!mp.data) return;
    setName(mp.data.account.name ?? '');
    setEmail(mp.data.account.email ?? '');
  }, [mp.data]);

  const save = () =>
    update.mutate(
      { name, email },
      {
        onSuccess: () => {
          toast.success('저장되었습니다');
          router.back();
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← 취소</Text></Pressable>
        <Text style={styles.title}>계정 정보</Text>
        <Pressable onPress={save}><Text style={styles.submit}>저장</Text></Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
          <TextInput label="이름" value={name} onChangeText={setName} maxLength={30} />
          <TextInput label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.hint}>전화번호는 카카오 동기화 값입니다.</Text>
          <Button label="저장" onPress={save} loading={update.isPending} fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
  submit: { ...typography.bodyBold, color: colors.primary },
  hint: { ...typography.caption, color: colors.textTertiary },
});
