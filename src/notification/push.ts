/**
 * FCM 푸시 토큰 관리 헬퍼.
 *
 * - Android 만 동작 (iOS 는 별도 PR — APNs 키 발급 필요)
 * - Expo Go 에선 동작 안 함 — `expo prebuild + expo run:android` 또는 EAS Build 필요
 * - `expo-notifications` 는 native 모듈이라 웹에서 import 시 throw → lazy require 패턴
 */

import { Platform } from 'react-native';
import { api } from '@/api/client';

const SUPPORTED = Platform.OS === 'android';

// 마지막으로 발급받은 FCM 토큰 — 로그아웃 시 DELETE 에 사용
let currentToken: string | null = null;

type Notifications = typeof import('expo-notifications');
type Device = typeof import('expo-device');

async function loadModules(): Promise<{ Notifications: Notifications; Device: Device } | null> {
  if (!SUPPORTED) return null;
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    return { Notifications, Device };
  } catch {
    return null;
  }
}

/**
 * 권한 요청 → FCM 디바이스 토큰 발급 → 백엔드 등록.
 * 권한 거부 / 에뮬레이터 등에서는 무음으로 skip — 호출 측에서 throw 안 됨.
 */
export async function registerPushTokenIfNeeded(): Promise<string | null> {
  const mods = await loadModules();
  if (!mods) return null;
  const { Notifications, Device } = mods;

  if (!Device.isDevice) {
    // 에뮬레이터 / 시뮬레이터는 FCM 토큰 발급 안 됨
    return null;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    // Expo 푸시 서비스가 아니라 native FCM 토큰 직접 발급
    const result = await Notifications.getDevicePushTokenAsync();
    const token = result.data;
    if (!token || typeof token !== 'string') return null;

    await api.post('/api/v1/push-tokens', { platform: 'ANDROID', token });
    currentToken = token;
    return token;
  } catch {
    // race condition (401 등) 시 무음 처리 — 다음 부팅 시 재시도
    return null;
  }
}

/**
 * 로그아웃 시 호출.
 * 백엔드에서 토큰 삭제(멱등) + 디바이스 측 unregister.
 */
export async function unregisterPushToken(): Promise<void> {
  const mods = await loadModules();
  if (!mods) return;
  const { Notifications } = mods;

  const token = currentToken;
  currentToken = null;

  try {
    if (token) {
      await api.delete('/api/v1/push-tokens', { data: { token } });
    }
  } catch {
    /* 백엔드 삭제 실패 무음 — 로그아웃 흐름 막지 않음 */
  }

  try {
    await Notifications.unregisterForNotificationsAsync();
  } catch {
    /* 디바이스 unregister 실패 무음 */
  }
}

/**
 * 알림 수신 핸들러 등록 — `app/_layout.tsx` 부팅 시 1회.
 *
 * foreground: 알림을 시스템 트레이에 표시 + sound 재생
 * background/tapped: data.deepLink 로 라우팅 (콜백 측 전달)
 */
export async function setupNotificationHandlers(
  onTap: (deepLink: string) => void,
): Promise<(() => void) | null> {
  const mods = await loadModules();
  if (!mods) return null;
  const { Notifications } = mods;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as { deepLink?: string } | undefined;
    if (data?.deepLink && typeof data.deepLink === 'string') {
      onTap(data.deepLink);
    }
  });

  return () => sub.remove();
}
