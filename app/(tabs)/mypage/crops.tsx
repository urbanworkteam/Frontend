import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useCreateCrop, useCrops, useDeleteCrop, useUpdateCrop, type Crop } from '@/api/crop';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { Modal } from '@/ui/components/Modal';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

const PALETTE = [
  '#FF5A5A',
  '#FFB35A',
  '#FFD95A',
  '#7FCE6B',
  '#2BA651',
  '#5BC0EB',
  '#5A6FFF',
  '#B45AFF',
  '#FF5AAE',
  '#9CA3AF',
] as const;

type EditTarget =
  | { mode: 'add' }
  | { mode: 'edit'; crop: Crop };

export default function CropsManageScreen() {
  const crops = useCrops();
  const create = useCreateCrop();
  const update = useUpdateCrop();
  const del = useDeleteCrop();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Crop | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack('/(tabs)/mypage')} hitSlop={12}>
          <Text style={styles.back}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.title}>재배 작물 관리</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.sm }}>
        {crops.isLoading ? <ActivityIndicator /> : null}
        {(crops.data ?? []).map((c) => (
          <View key={c.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: c.colorHex }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cropName}>{c.name}</Text>
              {c.stage ? <Text style={styles.cropStage}>{c.stage}</Text> : null}
            </View>
            <Pressable
              style={styles.iconBtn}
              onPress={() => setEditTarget({ mode: 'edit', crop: c })}
              hitSlop={4}
            >
              <Text style={styles.iconBtnText}>✎</Text>
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setDeleteTarget(c)} hitSlop={4}>
              <Text style={[styles.iconBtnText, { color: colors.danger }]}>🗑</Text>
            </Pressable>
          </View>
        ))}

        <Button
          label="+ 작물 추가"
          variant="secondary"
          onPress={() => setEditTarget({ mode: 'add' })}
          fullWidth
        />

        <Text style={styles.hint}>
          등록한 작물은 영농일지 작성 시 작물 선택 목록에 자동으로 연결됩니다.
        </Text>
      </ScrollView>

      <CropEditModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onAdd={(body) =>
          create.mutate(body, {
            onSuccess: () => {
              setEditTarget(null);
              toast.success('작물이 추가되었어요');
            },
            onError: (e) => toast.error((e as Error).message ?? '추가에 실패했어요'),
          })
        }
        onUpdate={(id, body) =>
          update.mutate(
            { id, body },
            {
              onSuccess: () => {
                setEditTarget(null);
                toast.success('작물이 수정되었어요');
              },
              onError: (e) => toast.error((e as Error).message ?? '수정에 실패했어요'),
            },
          )
        }
        saving={create.isPending || update.isPending}
      />

      <Modal
        visible={!!deleteTarget}
        title={`'${deleteTarget?.name}' 작물을 삭제할까요?`}
        message="이미 작성된 일지는 그대로 유지됩니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          del.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
              toast.success('삭제되었어요');
            },
            onError: (e) => {
              setDeleteTarget(null);
              toast.error((e as Error).message ?? '삭제에 실패했어요');
            },
          });
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

type CropBody = { name: string; colorHex?: string; stage?: string };

function CropEditModal({
  target,
  onClose,
  onAdd,
  onUpdate,
  saving,
}: {
  target: EditTarget | null;
  onClose: () => void;
  onAdd: (body: CropBody) => void;
  onUpdate: (id: number, body: CropBody) => void;
  saving: boolean;
}) {
  const isEdit = target?.mode === 'edit';
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState<string>(PALETTE[4]);
  const [stage, setStage] = useState('');

  useEffect(() => {
    if (!target) return;
    if (target.mode === 'edit') {
      setName(target.crop.name);
      setColorHex(target.crop.colorHex ?? PALETTE[4]);
      setStage(target.crop.stage ?? '');
    } else {
      setName('');
      setColorHex(PALETTE[4]);
      setStage('');
    }
  }, [target]);

  if (!target) return null;

  const body: CropBody = {
    name: name.trim(),
    colorHex,
    stage: stage.trim() || undefined,
  };

  const canSave = !!body.name && !saving;

  return (
    <Modal
      visible={!!target}
      title={isEdit ? '작물 수정' : '작물 추가'}
      onClose={onClose}
      onConfirm={
        canSave
          ? () => {
              if (target.mode === 'edit') onUpdate(target.crop.id, body);
              else onAdd(body);
            }
          : undefined
      }
      confirmLabel={canSave ? (saving ? '저장 중...' : '저장') : '취소'}
      cancelLabel="취소"
    >
      <View style={{ gap: space.md, marginTop: space.md, marginBottom: space.sm }}>
        <TextInput
          label="이름"
          value={name}
          onChangeText={setName}
          placeholder="딸기"
          maxLength={50}
        />

        <View>
          <Text style={modalStyles.label}>색상</Text>
          <View style={modalStyles.paletteRow}>
            {PALETTE.map((c) => {
              const sel = c === colorHex;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColorHex(c)}
                  style={[modalStyles.swatch, { backgroundColor: c }, sel && modalStyles.swatchSel]}
                />
              );
            })}
          </View>
        </View>

        <TextInput
          label="재배 단계 (선택)"
          value={stage}
          onChangeText={setStage}
          placeholder="수확 중 / 6월 예정 등"
          maxLength={100}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: radius.md,
    ...shadow.card,
  },
  dot: { width: 14, height: 14, borderRadius: 4 },
  cropName: { ...typography.bodyBold, color: colors.textPrimary },
  cropStage: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  iconBtnText: { fontSize: 16, color: colors.textPrimary },

  hint: { ...typography.caption, color: colors.textSecondary, marginTop: space.md, textAlign: 'center' },
});

const modalStyles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: space.xs },
  paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSel: { borderColor: colors.textPrimary },
});
