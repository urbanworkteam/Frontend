import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, space, typography } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyle[size],
        variantStyle(variant, isDisabled, pressed),
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.label, labelColor(variant, isDisabled)]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: { ...typography.bodyBold },
});

const sizeStyle: Record<Size, ViewStyle> = {
  sm: { paddingVertical: space.sm, paddingHorizontal: space.md, minHeight: 36 },
  md: { paddingVertical: space.md, paddingHorizontal: space.lg, minHeight: 44 },
  lg: { paddingVertical: space.lg, paddingHorizontal: space.xl, minHeight: 52 },
};

function variantStyle(v: Variant, disabled: boolean, pressed: boolean): ViewStyle {
  if (v === 'primary') {
    return {
      backgroundColor: disabled ? colors.primaryDim : pressed ? colors.primaryDark : colors.primary,
    };
  }
  if (v === 'danger') {
    return { backgroundColor: disabled ? colors.dangerBg : colors.danger };
  }
  if (v === 'secondary') {
    return {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: disabled ? colors.border : colors.borderStrong,
    };
  }
  return { backgroundColor: 'transparent' };
}

function labelColor(v: Variant, disabled: boolean) {
  if (v === 'primary' || v === 'danger') return { color: '#fff' };
  return { color: disabled ? colors.textTertiary : colors.textPrimary };
}
