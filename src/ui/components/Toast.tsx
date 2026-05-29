import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useUiStore } from '@/state/uiStore';
import { colors, radius, shadow, space, typography } from '../tokens';

export function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  const dismiss = useUiStore((s) => s.dismissToast);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => dismiss());
    }, toast.durationMs ?? 2500);
    return () => clearTimeout(t);
  }, [toast, opacity, dismiss]);

  if (!toast) return null;
  const bg =
    toast.kind === 'error' ? colors.danger : toast.kind === 'success' ? colors.success : colors.textPrimary;
  return (
    <Animated.View pointerEvents="none" style={[styles.host, { opacity, backgroundColor: bg }]}>
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: 80,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    ...shadow.card,
  },
  text: { color: '#fff', textAlign: 'center', ...typography.body },
});
