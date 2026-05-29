import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { HandleStep } from '@/screens/onboarding/HandleStep';
import { RegionStep } from '@/screens/onboarding/RegionStep';
import { CropsStep } from '@/screens/onboarding/CropsStep';
import { LocationStep } from '@/screens/onboarding/LocationStep';
import { GuideStep } from '@/screens/onboarding/GuideStep';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useOnboard } from '@/api/auth';
import { colors, radius, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

const TOTAL = 5;

export default function OnboardingScreen() {
  const step = useOnboardingDraft((s) => s.step);
  const setStep = useOnboardingDraft((s) => s.setStep);
  const toRequest = useOnboardingDraft((s) => s.toRequest);
  const reset = useOnboardingDraft((s) => s.reset);
  const [submitting, setSubmitting] = useState(false);
  const onboard = useOnboard();

  const next = () => setStep(Math.min(TOTAL - 1, step + 1));
  const back = () => setStep(Math.max(0, step - 1));

  const submit = async () => {
    setSubmitting(true);
    try {
      await onboard.mutateAsync(toRequest());
      next();
    } catch (e) {
      const err = e as { code?: string; message?: string; field?: string };
      if (err.code === 'HANDLE_TAKEN' || err.code === 'HANDLE_INVALID_FORMAT') {
        toast.error('handle 을 다시 확인해주세요');
        setStep(0);
      } else if (err.code === 'FARM_LOCATION_REQUIRED') {
        toast.error('농장 위치가 필요합니다');
        setStep(3);
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
        <Text style={styles.progressText}>{step + 1} / {TOTAL}</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${((step + 1) / TOTAL) * 100}%` }]} />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {step === 0 && <HandleStep onNext={next} />}
        {step === 1 && <RegionStep onNext={next} onBack={back} />}
        {step === 2 && <CropsStep onNext={next} onBack={back} />}
        {step === 3 && <LocationStep onSubmit={submit} onBack={back} submitting={submitting} />}
        {step === 4 && <GuideStep onDone={onFinish} />}
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
