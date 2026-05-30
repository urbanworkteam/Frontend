import React from 'react';
import { Stack } from 'expo-router';

// 일지 탭 내부의 sub-route들을 Stack 으로 묶어서 (tabs) 탭바에 자동 노출되지 않게 함.
// index 만 탭바에 보이고, write / write-complete / [id] 는 push 진입.
export default function DiaryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="write" />
      <Stack.Screen name="write-complete" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
