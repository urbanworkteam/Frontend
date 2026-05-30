import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { InfoStep } from '@/screens/onboarding/InfoStep';
import { GuideStep } from '@/screens/onboarding/GuideStep';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useOnboard } from '@/api/auth';
import { colors, radius, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

const TOTAL = 2;

export default function OnboardingScreen() {
  const step = useOnboardingDraft((s) => s.step);
  const setStep = useOnboardingDraft((s) => s.setStep);
  const toRequest = useOnboardingDraft((s) => s.toRequest);
  const reset = useOnboardingDraft((s) => s.reset);
  const [submitting, setSubmitting] = useState(false);
  const onboard = useOnboard();

  const submit = async () => {
    setSubmitting(true);
    try {
      await onboard.mutateAsync(toRequest());
      setStep(1);
    } catch (e) {
      const err = e as { code?: string; message?: string; field?: string };
      if (err.code === 'HANDLE_TAKEN' || err.code === 'HANDLE_INVALID_FORMAT') {
        toast.error('명함 주소(handle)를 다시 확인해주세요');
      } else if (err.code === 'FARM_LOCATION_REQUIRED') {
        toast.error('농장 위치가 필요합니다');
      } else {
        toast.error(err.message ?? '가입 실패');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onFinish = () => {
    reset();
    router.replace('/(tabs)/diary');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {step + 1} / {TOTAL}
        </Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${((step + 1) / TOTAL) * 100}%` }]} />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {step === 0 && <InfoStep onSubmit={submit} submitting={submitting} />}
        {step === 1 && <GuideStep onDone={onFinish} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  progress: { paddingHorizontal: space.xl, paddingTop: space.md, gap: space.xs },
  progressText: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  bar: { height: 4, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: colors.primary },
});
