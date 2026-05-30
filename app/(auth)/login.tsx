import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useKakaoLogin } from '@/api/auth';
import { loginWithKakao } from '@/auth/kakao';
import { KakaoButton } from '@/screens/auth/KakaoButton';
import { TextInput } from '@/ui/components/TextInput';
import { Button } from '@/ui/components/Button';
import { colors, radius, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function LoginScreen() {
  const kakaoLogin = useKakaoLogin();
  const [devCode, setDevCode] = useState('');

  const onKakao = async () => {
    try {
      await loginWithKakao();
      toast.info('카카오 로그인 흐름은 dev client 빌드 후 활성화됩니다.');
    } catch {
      toast.info('카카오 SDK 미연결: 아래 "개발자 코드" 입력으로 진행 가능');
    }
  };

  const onDevSubmit = () => {
    if (!devCode.trim()) return;
    kakaoLogin.mutate(
      { code: devCode.trim() },
      {
        onSuccess: (data) => {
          if (data.isNewUser || !data.user.onboarded) {
            router.replace('/(auth)/onboarding');
          } else {
            router.replace('/(tabs)/diary');
          }
        },
        onError: (e: unknown) => {
          const msg = (e as Error)?.message ?? '로그인 실패';
          toast.error(msg);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.brand}>
          <View style={styles.logoCard}>
            <Text style={styles.logoIcon}>🌿</Text>
          </View>
          <Text style={styles.logoText}>Farmily</Text>
          <Text style={styles.tagline}>
            농민의 이야기를{'\n'}소비자와 연결합니다
          </Text>
        </View>

        <View style={styles.actions}>
          <KakaoButton onPress={onKakao} loading={kakaoLogin.isPending} />
          <Text style={styles.terms}>
            로그인 시 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
            <Text style={styles.termsLink}>개인정보 처리방침</Text>에 동의합니다.
          </Text>
          <Text style={styles.terms}>처음 로그인하면 자동으로 회원가입이 완료돼요.</Text>
        </View>

        <View style={styles.dev}>
          <Text style={styles.devLabel}>개발자 모드 (백엔드 카카오 code 직접 입력)</Text>
          <TextInput
            placeholder="kakao authorization code"
            value={devCode}
            onChangeText={setDevCode}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label="dev 로그인"
            variant="secondary"
            onPress={onDevSubmit}
            loading={kakaoLogin.isPending}
            disabled={!devCode.trim()}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage, paddingHorizontal: space.xl },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  logoCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  logoIcon: { fontSize: 40, color: colors.primary },
  logoText: { fontSize: 32, fontWeight: '700', color: colors.textPrimary },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: space.xs,
  },
  actions: { gap: space.md, marginBottom: space.xl },
  terms: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
  termsLink: { textDecorationLine: 'underline', color: colors.textSecondary },
  dev: {
    gap: space.sm,
    marginBottom: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  devLabel: { ...typography.caption, color: colors.textSecondary },
});
