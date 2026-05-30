import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, space, typography } from '@/ui/tokens';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { toast } from '@/state/uiStore';

export function LocationStep({
  onSubmit,
  onBack,
  submitting,
}: {
  onSubmit: () => void;
  onBack: () => void;
  submitting?: boolean;
}) {
  const label = useOnboardingDraft((s) => s.locationLabel);
  const address = useOnboardingDraft((s) => s.locationAddress);
  const setField = useOnboardingDraft((s) => s.setField);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);

  const isValid = !!label.trim() && !!address.trim();

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.error('위치 권한이 거부되었어요. 주소를 직접 입력해주세요.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const place = places[0];
      if (!place) {
        toast.error('주소를 찾지 못했어요. 직접 입력해주세요.');
        return;
      }
      const addr = [place.region, place.city, place.district, place.street, place.name]
        .filter(Boolean)
        .join(' ');
      setField('locationAddress', addr);
      setDetected(addr);
      toast.success('위치를 감지했어요');
    } catch (e) {
      toast.error('위치 감지에 실패했어요. 직접 입력해주세요.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>농장 위치</Text>
      <Text style={styles.help}>
        날씨 자동 입력에 사용됩니다. 도로명 주소를 권장합니다.
      </Text>

      <Pressable
        style={[styles.detectCard, detected && styles.detectCardSuccess]}
        onPress={detectLocation}
        disabled={detecting}
      >
        <View style={styles.detectIconWrap}>
          {detecting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.detectIcon}>{detected ? '✓' : '📍'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detectTitle}>
            {detecting
              ? '위치 감지 중...'
              : detected
                ? '위치 자동 감지됨'
                : '현재 위치 자동 감지'}
          </Text>
          {detected ? (
            <Text style={styles.detectSub}>{detected}</Text>
          ) : (
            <Text style={styles.detectSub}>탭하면 GPS로 현재 위치를 채워줍니다</Text>
          )}
        </View>
        {detected ? <Text style={styles.detectRetry}>재시도</Text> : null}
      </Pressable>

      <TextInput
        label="라벨"
        placeholder="1번 농장"
        value={label}
        onChangeText={(v) => setField('locationLabel', v)}
      />
      <TextInput
        label="주소"
        placeholder="충남 논산시 연무읍 안심리 123"
        value={address}
        multiline
        onChangeText={(v) => setField('locationAddress', v)}
      />

      <View style={{ flex: 1 }} />
      <View style={styles.row}>
        <Button label="이전" variant="ghost" onPress={onBack} style={{ flex: 1 }} disabled={submitting} />
        <Button
          label="가입 완료"
          onPress={onSubmit}
          disabled={!isValid}
          loading={submitting}
          style={{ flex: 2 }}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.xl, gap: space.md, flexGrow: 1 },
  title: { ...typography.header, color: colors.textPrimary },
  help: { ...typography.caption, color: colors.textSecondary, marginBottom: space.md },

  detectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  detectCardSuccess: { backgroundColor: '#E6F4EA', borderColor: colors.primary },
  detectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectIcon: { fontSize: 18, color: colors.primary },
  detectTitle: { ...typography.bodyBold, color: colors.textPrimary },
  detectSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  detectRetry: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  row: { flexDirection: 'row', gap: space.sm },
});
