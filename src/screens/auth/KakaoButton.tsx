import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, space, typography } from '@/ui/tokens';

type Props = { onPress: () => void; loading?: boolean; disabled?: boolean };

export function KakaoButton({ onPress, loading, disabled }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, disabled && { opacity: 0.6 }]}
      onPress={disabled || loading ? undefined : onPress}
    >
      {loading ? (
        <ActivityIndicator color="#191600" />
      ) : (
        <View style={styles.row}>
          <Text style={styles.bubble}>💬</Text>
          <Text style={styles.label}>카카오로 시작하기</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#FEE500',
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bubble: { fontSize: 18 },
  label: { ...typography.title, color: '#191600' },
});
