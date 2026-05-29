import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useKakaoLogin } from '@/api/auth';
import { loginWithKakao } from '@/auth/kakao';
import { KakaoButton } from '@/screens/auth/KakaoButton';
import { TextInput } from '@/ui/components/TextInput';
import { Button } from '@/ui/components/Button';
import { colors, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function LoginScreen() {
  const kakaoLogin = useKakaoLogin();
  const [devCode, setDevCode] = useState('');

  const onKakao = async () => {
    try {
      // 실 디바이스: 카카오 SDK 사용 (네이티브 모듈 필요). 백엔드 spec 보강 (kakaoAccessToken 지원) 후 변경.
      await loginWithKakao();
      toast.info('카카오 로그인 흐름은 dev client 빌드 후 활성화됩니다.');
    } catch (e) {
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
          <Text style={styles.logo}>🌱 Farmily</Text>
          <Text style={styles.tagline}>나의 농장을 한 장의 명함으로</Text>
        </View>
        <View style={styles.actions}>
          <KakaoButton onPress={onKakao} loading={kakaoLogin.isPending} />
          <Text style={styles.terms}>
            로그인하면 서비스 이용약관 및 개인정보처리방침에 동의한 것으로 간주합니다.
          </Text>
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
  logo: { fontSize: 32, fontWeight: '700', color: colors.primary },
  tagline: { ...typography.body, color: colors.textSecondary },
  actions: { gap: space.md, marginBottom: space.xl },
  terms: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
  dev: { gap: space.sm, marginBottom: space.xl, paddingTop: space.lg, borderTopWidth: 1, borderColor: colors.border },
  devLabel: { ...typography.caption, color: colors.textSecondary },
});
