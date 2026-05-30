import React from 'react';
import { Stack } from 'expo-router';

// 명함 메인(index)은 일반 화면, 명함 편집(edit)은 슬라이드업 모달로 표시.
// 모킹(02_내명함_02,03)의 바텀시트 형태와 가장 유사한 효과를 가벼운 옵션만으로 제공.
export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="calendar" />
      <Stack.Screen
        name="edit"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
