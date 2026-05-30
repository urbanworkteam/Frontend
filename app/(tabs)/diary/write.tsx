import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DiaryFormScreen } from '@/screens/diary/DiaryFormScreen';

export default function DiaryWriteScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  return <DiaryFormScreen mode="create" initialDate={params.date} />;
}
