import React from 'react';
import { StyleSheet, Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import { colors, radius, space, typography } from '../tokens';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export function TextInput({ label, error, hint, style, ...rest }: Props) {
  return (
    <View style={{ width: '100%' }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <RNTextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textTertiary}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: space.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger, marginTop: space.xs },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: space.xs },
});
