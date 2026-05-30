import React from 'react';
import { Stack } from 'expo-router';

// 콘텐츠 탭 내부의 sub-route를 Stack 으로 묶음 — index 만 탭바 노출.
export default function ContentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
