import { router, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { queryClient } from '@/state/queryClient';
import { ToastHost } from '@/ui/components/Toast';
import { useAuth } from '@/auth/useAuth';
import { registerPushTokenIfNeeded, setupNotificationHandlers } from '@/notification/push';

export default function RootLayout() {
  const hydrate = useAuth((s) => s.hydrate);
  const isAuthed = useAuth((s) => s.isAuthed);
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 인증 완료 후 푸시 토큰 등록 (Android 한정, 권한 거부/에뮬레이터/웹 무음 skip)
  useEffect(() => {
    if (!hydrated || !isAuthed) return;
    registerPushTokenIfNeeded();
  }, [hydrated, isAuthed]);

  // 알림 수신 핸들러 + tap 시 deepLink 라우팅
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    setupNotificationHandlers((deepLink) => {
      // 예: "farmily://diary/123" → "/(tabs)/diary/123"
      // 단순 mapping — 추후 확장 시 별도 router 헬퍼로 분리
      try {
        const url = new URL(deepLink);
        const path = url.pathname || '/';
        router.push(path as never);
      } catch {
        /* 잘못된 deepLink 무시 */
      }
    }).then((c) => {
      cleanup = c;
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAFAFA' } }} />
          <ToastHost />
          <StatusBar style="dark" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
