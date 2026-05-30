import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, space, typography } from '@/ui/tokens';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { checkHandle } from '@/api/auth';
import { toast } from '@/state/uiStore';

export function InfoStep({
  onSubmit,
  submitting,
}: {
  onSubmit: () => void;
  submitting?: boolean;
}) {
  const farmDisplayName = useOnboardingDraft((s) => s.farmDisplayName);
  const handle = useOnboardingDraft((s) => s.handle);
  const region = useOnboardingDraft((s) => s.region);
  const farmingMethod = useOnboardingDraft((s) => s.farmingMethod);
  const crops = useOnboardingDraft((s) => s.crops);
  const locationLabel = useOnboardingDraft((s) => s.locationLabel);
  const locationAddress = useOnboardingDraft((s) => s.locationAddress);
  const setField = useOnboardingDraft((s) => s.setField);
  const addCrop = useOnboardingDraft((s) => s.addCrop);
  const removeCrop = useOnboardingDraft((s) => s.removeCrop);

  const [cropInput, setCropInput] = useState('');
  const [handleCheck, setHandleCheck] = useState<{
    available: boolean | null;
    suggestions: string[];
  }>({ available: null, suggestions: [] });
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (!handle) {
      setHandleCheck({ available: null, suggestions: [] });
      return;
    }
    if (!handle.match(/^[a-z0-9-]{3,30}$/)) {
      setHandleCheck({ available: null, suggestions: [] });
      return;
    }
    const t = setTimeout(async () => {
      setCheckingHandle(true);
      try {
        const res = await checkHandle(handle);
        setHandleCheck(res);
      } catch {
        setHandleCheck({ available: null, suggestions: [] });
      } finally {
        setCheckingHandle(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [handle]);

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
      setDetected(true);
      toast.success('위치를 감지했어요');
    } catch {
      toast.error('위치 감지에 실패했어요. 직접 입력해주세요.');
    } finally {
      setDetecting(false);
    }
  };

  const addCropFromInput = () => {
    const t = cropInput.trim();
    if (!t) return;
    addCrop(t);
    setCropInput('');
  };

  const handleValid = !!handle.match(/^[a-z0-9-]{3,30}$/) && handleCheck.available === true;
  const isValid =
    !!farmDisplayName.trim() &&
    handleValid &&
    !!locationLabel.trim() &&
    !!locationAddress.trim() &&
    crops.length > 0 &&
    !submitting;

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <View style={styles.brandRow}>
        <Text style={styles.brand}>🌱 Farmily</Text>
      </View>

      <Text style={styles.title}>농장 정보를{'\n'}설정해 주세요</Text>
      <Text style={styles.help}>마이페이지에서 언제든지 수정할 수 있어요.</Text>

      {/* 농장 이름 */}
      <View style={styles.field}>
        <Text style={styles.label}>🏡 농장 이름 *</Text>
        <TextInput
          placeholder="예) 강씨네 딸기농장"
          value={farmDisplayName}
          onChangeText={(v) => setField('farmDisplayName', v)}
          maxLength={50}
        />
      </View>

      {/* handle */}
      <View style={styles.field}>
        <Text style={styles.label}>🔗 명함 주소 (영문) *</Text>
        <TextInput
          placeholder="kang-strawberry"
          value={handle}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(v) =>
            setField('handle', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }
          error={
            handle && !handle.match(/^[a-z0-9-]{3,30}$/)
              ? '영문/숫자/하이픈 3-30자만 가능'
              : handleCheck.available === false
                ? '이미 사용 중입니다'
                : null
          }
          hint={
            checkingHandle
              ? '확인 중...'
              : handleCheck.available === true
                ? `farmily.kr/@${handle} ✓`
                : `명함 URL: farmily.kr/@${handle || 'your-handle'}`
          }
        />
        {handleCheck.suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestLabel}>추천:</Text>
            {handleCheck.suggestions.map((s) => (
              <Pressable key={s} onPress={() => setField('handle', s)} style={styles.suggestChip}>
                <Text style={styles.suggestChipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* 농장 위치 */}
      <View style={styles.field}>
        <Text style={styles.label}>📍 농장 위치 *</Text>
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
            <Text style={styles.detectSub}>
              {detected
                ? locationAddress
                : '탭하면 GPS로 현재 위치를 채워줍니다'}
            </Text>
          </View>
          {detected ? <Text style={styles.detectRetry}>재시도</Text> : null}
        </Pressable>

        <View style={{ height: space.sm }} />
        <TextInput
          label="라벨"
          placeholder="1번 농장"
          value={locationLabel}
          onChangeText={(v) => setField('locationLabel', v)}
        />
        <View style={{ height: space.sm }} />
        <TextInput
          label="주소 (직접 입력)"
          placeholder="충남 논산시 연무읍 안심리 123"
          value={locationAddress}
          multiline
          onChangeText={(v) => setField('locationAddress', v)}
        />
      </View>

      {/* 재배 작물 */}
      <View style={styles.field}>
        <Text style={styles.label}>🌿 재배 작물 * <Text style={styles.labelHint}>(복수 등록 가능)</Text></Text>
        {crops.length > 0 ? (
          <View style={styles.cropChips}>
            {crops.map((c) => (
              <View key={c.name} style={styles.cropChip}>
                <Text style={styles.cropChipText}>🌱 {c.name}</Text>
                <Pressable onPress={() => removeCrop(c.name)} hitSlop={4}>
                  <Text style={styles.cropChipX}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.cropAddRow}>
          <TextInput
            placeholder="작물 이름 입력 (예: 딸기)"
            value={cropInput}
            onChangeText={setCropInput}
            onSubmitEditing={addCropFromInput}
            returnKeyType="done"
            style={{ flex: 1 }}
          />
          <Pressable
            onPress={addCropFromInput}
            disabled={!cropInput.trim()}
            style={[styles.cropAddBtn, !cropInput.trim() && styles.cropAddBtnDisabled]}
          >
            <Text style={styles.cropAddBtnText}>추가</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: space.md }} />

      <Button
        label={submitting ? '가입 중...' : '다음 →'}
        onPress={onSubmit}
        disabled={!isValid}
        loading={submitting}
        fullWidth
      />

      <Pressable hitSlop={4} style={{ alignSelf: 'center', marginTop: space.md }}>
        <Text style={styles.skipLink}>나중에 설정하기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.xl, gap: space.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.sm },
  brand: {
    ...typography.title,
    color: colors.primary,
    backgroundColor: '#E6F4EA',
    paddingVertical: 4,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    fontWeight: '700',
  },
  title: { ...typography.header, color: colors.textPrimary, fontSize: 26, lineHeight: 34 },
  help: { ...typography.body, color: colors.textSecondary, marginBottom: space.md },

  field: { gap: space.xs },
  label: { ...typography.bodyBold, color: colors.textPrimary },
  labelHint: { ...typography.caption, color: colors.textSecondary, fontWeight: '400' },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  suggestLabel: { ...typography.caption, color: colors.textSecondary, alignSelf: 'center' },
  suggestChip: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  suggestChipText: { ...typography.caption, color: colors.textPrimary },

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

  cropChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.sm },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: space.md,
  },
  cropChipText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  cropChipX: { fontSize: 16, color: colors.primary, fontWeight: '700' },

  cropAddRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  cropAddBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
  },
  cropAddBtnDisabled: { opacity: 0.5 },
  cropAddBtnText: { ...typography.bodyBold, color: colors.textPrimary },

  skipLink: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
