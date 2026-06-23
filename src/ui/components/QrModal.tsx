import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

interface QrModalProps {
  visible: boolean;
  url: string;
  farmName: string;
  onClose: () => void;
}

export function QrModal({ visible, url, farmName, onClose }: QrModalProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{farmName}</Text>
          <Text style={styles.subtitle}>QR코드를 스캔하면 농장 프로필로 이동합니다</Text>

          <View style={styles.qrWrap}>
            <QRCode value={url} size={200} color={colors.textPrimary} backgroundColor="#ffffff" />
          </View>

          <Pressable style={styles.urlRow} onPress={onCopy}>
            <Text style={styles.urlText}>{url}</Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={16}
              color={copied ? colors.primary : colors.textTertiary}
            />
          </Pressable>
          {copied ? <Text style={styles.copiedText}>링크가 복사되었습니다</Text> : null}

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
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  urlText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  copiedText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: -space.sm,
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
