import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useKakaoLogin } from '@/api/auth';
import { consumeKakaoState } from '@/auth/kakao';
import { env } from '@/config/env';
import { colors, radius, space, typography } from '@/ui/tokens';

/**
 * 카카오 OAuth 콜백.
 *
 * 흐름: `/oauth/kakao?code=...&state=...&error=...` 로 카카오가 리디렉트.
 * 1. error 파라미터가 있으면 즉시 에러 화면
 * 2. state 검증 (sessionStorage 와 일치) — CSRF 방어
 * 3. `POST /api/v1/auth/kakao { code, redirectUri }` 호출
 * 4. 성공 → 신규/온보딩 미완료면 온보딩, 아니면 일지 화면
 */
export default function KakaoCallback() {
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string; error_description?: string }>();
  const login = useKakaoLogin();
  const [error, setError] = useState<string | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (params.error) {
      setError(params.error_description || params.error);
      return;
    }
    if (!params.code) {
      setError('카카오 인가 코드가 없습니다');
      return;
    }
    if (!consumeKakaoState(params.state)) {
      setError('state 검증 실패 — 새로 로그인해주세요 (CSRF 보호)');
      return;
    }

    login.mutate(
      { code: params.code, redirectUri: env.kakaoRedirectUri },
      {
        onSuccess: (data) => {
          if (data.isNewUser || !data.user.onboarded) {
            router.replace('/(auth)/onboarding');
          } else {
            router.replace('/(tabs)/diary');
          }
        },
        onError: (e: unknown) => {
          setError((e as Error)?.message ?? '로그인 실패');
        },
      },
    );
  }, [params.code, params.state, params.error, params.error_description, login]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>로그인 실패</Text>
          <Text style={styles.message}>{error}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>로그인 화면으로 돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.message}>카카오 로그인 처리 중...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  title: { ...typography.header, color: colors.textPrimary },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  button: {
    marginTop: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  buttonText: { ...typography.bodyBold, color: '#fff' },
});
