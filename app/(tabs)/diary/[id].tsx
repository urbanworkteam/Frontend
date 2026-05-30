import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useDeleteDiary, useDiary } from '@/api/diary';
import { DiaryFormScreen } from '@/screens/diary/DiaryFormScreen';
import { Modal } from '@/ui/components/Modal';
import { colors, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function DiaryEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const diaryId = id ? parseInt(id, 10) : null;
  const diary = useDiary(diaryId);
  const del = useDeleteDiary();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!diaryId || Number.isNaN(diaryId)) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.error}>잘못된 접근입니다</Text>
        <Pressable onPress={() => router.replace('/(tabs)/diary')} hitSlop={12}>
          <Text style={styles.link}>달력으로 돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (diary.isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (diary.isError || !diary.data) {
    const err = diary.error as { code?: string; message?: string } | null;
    const message =
      err?.code === 'NOT_FOUND' || err?.code === 'DIARY_NOT_FOUND'
        ? '일지를 찾을 수 없습니다'
        : err?.code === 'FORBIDDEN' || err?.code === 'NOT_RESOURCE_OWNER'
          ? '접근 권한이 없습니다'
          : (err?.message ?? '일지를 불러오지 못했습니다');
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.error}>{message}</Text>
        <Pressable onPress={() => router.replace('/(tabs)/diary')} hitSlop={12}>
          <Text style={styles.link}>달력으로 돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const onDelete = () => {
    del.mutate(diaryId, {
      onSuccess: () => {
        toast.success('일지를 삭제했어요');
        setConfirmOpen(false);
        router.replace('/(tabs)/diary');
      },
      onError: (e) => {
        toast.error((e as Error).message ?? '삭제에 실패했어요');
        setConfirmOpen(false);
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <DiaryFormScreen
        mode="edit"
        diaryId={diaryId}
        initialData={diary.data}
        onDelete={() => setConfirmOpen(true)}
      />
      <Modal
        visible={confirmOpen}
        title="일지를 삭제할까요?"
        message="삭제한 일지는 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        destructive
        onConfirm={onDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  error: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
  link: { ...typography.bodyBold, color: colors.primary, marginTop: space.sm },
});
