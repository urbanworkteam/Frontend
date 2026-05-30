import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, space, typography } from '../tokens';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function Modal({
  visible,
  title,
  message,
  children,
  onClose,
  onConfirm,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive,
}: Props) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <View style={styles.row}>
            {onConfirm ? (
              <Button label={cancelLabel} variant="secondary" onPress={onClose} fullWidth style={{ flex: 1 }} />
            ) : null}
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm ?? onClose}
              fullWidth
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    ...shadow.card,
  },
  title: { ...typography.header, color: colors.textPrimary, marginBottom: space.sm },
  message: { ...typography.body, color: colors.textSecondary, marginBottom: space.lg },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
});
