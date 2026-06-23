import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, typography } from '@/ui/tokens';

interface AppHeaderLogoProps {
  right?: React.ReactNode;
}

interface AppHeaderTitleProps {
  title: string;
  right?: React.ReactNode;
}

export function AppHeaderLogo({ right }: AppHeaderLogoProps) {
  return (
    <View style={styles.bar}>
      <Text style={styles.logo}>Farmily</Text>
      {right ? <View style={styles.right}>{right}</View> : <View style={styles.placeholder} />}
    </View>
  );
}

export function AppHeaderTitle({ title, right }: AppHeaderTitleProps) {
  return (
    <View style={styles.bar}>
      <Text style={styles.titleAbsolute}>{title}</Text>
      <View style={styles.rightContainer}>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

export function HeaderIconBtn({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={styles.iconBtn} onPress={onPress} hitSlop={8}>
      {children}
    </Pressable>
  );
}

export function HeaderTextBtn({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.textBtn} onPress={onPress} hitSlop={8}>
      <Text style={styles.textBtnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { ...typography.bodyBold, color: colors.primary, fontSize: 18, width: 80 },
  titleAbsolute: {
    ...typography.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  rightContainer: { flex: 1, alignItems: 'flex-end' },
  right: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  placeholder: { width: 80 },
  iconBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: space.xs + 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  textBtnLabel: { ...typography.bodyBold, color: colors.textPrimary },
});
