import React from 'react';
import { Stack } from 'expo-router';

// 마이페이지 탭 내부의 sub-route 를 Stack 으로 묶음 — index 만 탭바 노출.
// checkout 은 PG 결제 WebView 라서 modal 로 띄움.
export default function MyPageLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="crops" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="subscription" />
      <Stack.Screen
        name="checkout"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
