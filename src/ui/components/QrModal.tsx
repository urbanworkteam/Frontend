import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

interface QrModalProps {
  visible: boolean;
  url: string;
  farmName: string;
  onClose: () => void;
}

export function QrModal({ visible, url, farmName, onClose }: QrModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{farmName}</Text>
          <Text style={styles.subtitle}>QR코드를 스캔하면 농장 프로필로 이동합니다</Text>

          <View style={styles.qrWrap}>
            <QRCode value={url} size={200} color={colors.textPrimary} backgroundColor="#ffffff" />
          </View>

          <Text style={styles.urlText}>{url}</Text>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    gap: space.md,
    ...shadow.card,
  },
  title: { ...typography.header, fontSize: 18, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  qrWrap: {
    padding: space.lg,
    backgroundColor: '#ffffff',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urlText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.xxl,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  closeBtnText: { ...typography.bodyBold, color: colors.textPrimary },
});
