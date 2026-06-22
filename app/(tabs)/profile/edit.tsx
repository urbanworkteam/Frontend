import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

// 판매처 아이콘 이미지
const CHANNEL_ICONS = {
  SMARTSTORE: require('../../../assets/icons/smartstore.png'),
  INSTAGRAM: require('../../../assets/icons/instagram.png'),
  DAANGN: require('../../../assets/icons/daangn.png'),
} as const;
import { safeBack } from '@/lib/nav';
import {
  useAddTextBlock,
  useDeleteBlock,
  useMyProfile,
  useReorderBlocks,
  useUpdateProfile,
  type SalesChannelCode,
} from '@/api/profile';
import { extOf, uploadToS3, usePresign } from '@/api/upload';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

const CHANNEL_META: Record<SalesChannelCode, { label: string; placeholder: string; iconSize: number }> = {
  SMARTSTORE: { label: '스마트스토어', placeholder: 'smartstore.naver.com/...', iconSize: 28 },
  INSTAGRAM: { label: '인스타그램', placeholder: 'instagram.com/...', iconSize: 28 },
  DAANGN: { label: '당근', placeholder: '당근 링크 입력', iconSize: 28 },
};
const CHANNELS: SalesChannelCode[] = ['SMARTSTORE', 'INSTAGRAM', 'DAANGN'];

export default function ProfileEditScreen() {
  const profile = useMyProfile();
  const update = useUpdateProfile();
  const presign = usePresign();
  const reorder = useReorderBlocks();
  const addText = useAddTextBlock();
  const deleteBlock = useDeleteBlock();

  const [farmName, setFarmName] = useState('');
  const [region, setRegion] = useState('');
  const [farmingMethod, setFarmingMethod] = useState('');
  const [story, setStory] = useState('');
  const [channelUrls, setChannelUrls] = useState<Record<SalesChannelCode, string>>({
    SMARTSTORE: '',
    INSTAGRAM: '',
    DAANGN: '',
  });

  const [bgKey, setBgKey] = useState<string | undefined>();
  const [bgPreview, setBgPreview] = useState<string | undefined>();
  const [avatarKey, setAvatarKey] = useState<string | undefined>();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();

  useEffect(() => {
    if (!profile.data) return;
    const f = profile.data.farm;
    setFarmName(f.farmName ?? '');
    setRegion(f.region ?? '');
    setFarmingMethod(f.farmingMethod ?? '');
    setStory(f.story.text ?? '');
    setBgPreview(f.backgroundImageUrl ?? undefined);
    setAvatarPreview(f.avatarImageUrl ?? undefined);
    const next: Record<SalesChannelCode, string> = { SMARTSTORE: '', INSTAGRAM: '', DAANGN: '' };
    profile.data.salesChannels.forEach((c) => {
      next[c.channel] = c.url;
    });
    setChannelUrls(next);
  }, [profile.data]);

  const pickImage = async (kind: 'profile_bg' | 'profile_avatar') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      selectionLimit: 1,
      allowsEditing: true,
      aspect: kind === 'profile_avatar' ? [1, 1] : [16, 9],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      toast.error('10MB 이하 이미지만 첨부 가능합니다');
      return;
    }
    try {
      const ps = await presign.mutateAsync({
        kind: kind === 'profile_bg' ? 'PROFILE_BG' : 'PROFILE_AVATAR',
        ext: extOf(asset.uri),
        sizeBytes: asset.fileSize ?? 0,
      });
      await uploadToS3(ps.uploadUrl, asset.uri, asset.mimeType ?? 'image/jpeg');
      if (kind === 'profile_bg') {
        setBgKey(ps.key);
        setBgPreview(ps.publicUrl ?? asset.uri);
      } else {
        setAvatarKey(ps.key);
        setAvatarPreview(ps.publicUrl ?? asset.uri);
      }
    } catch {
      toast.error('사진 업로드에 실패했어요');
    }
  };

  const save = () => {
    const channels = CHANNELS.map((code) => ({ channel: code, url: channelUrls[code].trim() })).filter(
      (c) => c.url,
    );
    update.mutate(
      {
        farm: { farmName, region, farmingMethod },
        backgroundImageKey: bgKey,
        avatarImageKey: avatarKey,
        story: { text: story },
        salesChannels: channels,
      },
      {
        onSuccess: () => {
          toast.success('저장되었습니다');
          safeBack('/(tabs)/profile');
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const toggleVisible = (blockId: number) => {
    if (!profile.data) return;
    const blocks = profile.data.blocks.map((b) =>
      b.id === blockId
        ? { id: b.id, sortOrder: b.sortOrder, visible: !b.visible, payload: b.payload }
        : { id: b.id, sortOrder: b.sortOrder, visible: b.visible, payload: b.payload },
    );
    reorder.mutate(blocks);
  };

  if (profile.isLoading || !profile.data) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack('/(tabs)/profile')} hitSlop={8}>
          <Text style={styles.back}>취소</Text>
        </Pressable>
        <Text style={styles.title}>명함 편집</Text>
        <Pressable onPress={save} hitSlop={8} disabled={update.isPending}>
          <Text style={[styles.submit, update.isPending && { color: colors.textTertiary }]}>저장</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }}>
          {/* 배경 사진 */}
          <Field label="배경 사진">
            <Pressable
              style={styles.bgSlot}
              onPress={() => pickImage('profile_bg')}
              disabled={presign.isPending}
            >
              {bgPreview ? (
                <Image source={{ uri: bgPreview }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <>
                  <Ionicons name="image" size={28} color={colors.textSecondary} />
                  <Text style={styles.bgPlaceholder}>배경 사진 추가</Text>
                </>
              )}
              {bgPreview ? (
                <View style={styles.bgEditOverlay}>
                  <Text style={styles.bgEditText}>✎ 변경</Text>
                </View>
              ) : null}
            </Pressable>
          </Field>

          {/* 프로필 사진 */}
          <Field label="프로필 사진">
            <Pressable
              style={styles.avatarSlot}
              onPress={() => pickImage('profile_avatar')}
              disabled={presign.isPending}
            >
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <>
                  <Ionicons name="person" size={24} color={colors.textSecondary} />
                  <Text style={styles.avatarPlaceholder}>프로필</Text>
                </>
              )}
            </Pressable>
          </Field>

          <View style={styles.divider} />

          {/* 농장 이름 */}
          <TextInput label="농장 이름" value={farmName} onChangeText={setFarmName} maxLength={50} />

          {/* 지역 · 한줄 소개 */}
          <TextInput
            label="지역 · 한줄 소개"
            value={region}
            onChangeText={setRegion}
            maxLength={50}
            placeholder="충남 논산"
          />
          <TextInput
            label="재배 방식"
            value={farmingMethod}
            onChangeText={setFarmingMethod}
            maxLength={100}
            placeholder="친환경 재배"
          />

          <View style={styles.divider} />

          {/* 판매처 링크 */}
          <Field label="판매처 링크">
            <View style={{ gap: space.sm }}>
              {CHANNELS.map((code) => {
                const meta = CHANNEL_META[code];
                return (
                  <View key={code} style={styles.channelRow}>
                    <Image source={CHANNEL_ICONS[code]} style={{ width: meta.iconSize, height: meta.iconSize, borderRadius: 6 }} />
                    <TextInput
                      value={channelUrls[code]}
                      onChangeText={(v) => setChannelUrls((s) => ({ ...s, [code]: v }))}
                      placeholder={meta.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={{ flex: 1 }}
                    />
                  </View>
                );
              })}
            </View>
          </Field>

          <View style={styles.divider} />

          {/* 재배 스토리 (우리만의 기능) */}
          <Field label="재배 스토리 (선택)">
            <TextInput
              value={story}
              onChangeText={setStory}
              placeholder="작물에 담긴 정성과 이야기..."
              multiline
              maxLength={5000}
              hint={`${story.length}/5000`}
            />
          </Field>

          {/* 명함 블록 토글 (우리만의 기능 — 모킹에 없음) */}
          <Field label="명함 블록 노출/숨김">
            <View style={styles.blockList}>
              {profile.data.blocks.map((b) => (
                <View key={b.id} style={styles.blockRow}>
                  <Text style={styles.blockLabel}>{b.blockType}</Text>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={() => toggleVisible(b.id)}
                    style={[styles.toggle, b.visible ? styles.toggleOn : styles.toggleOff]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        b.visible ? { color: '#fff' } : { color: colors.textSecondary },
                      ]}
                    >
                      {b.visible ? '노출' : '숨김'}
                    </Text>
                  </Pressable>
                  {b.blockType === 'TEXT' ? (
                    <Pressable
                      onPress={() => deleteBlock.mutate(b.id)}
                      style={styles.blockDeleteBtn}
                      hitSlop={4}
                    >
                      <Text style={styles.blockDelete}>×</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
            <Button
              label="+ 텍스트 블록 추가"
              variant="secondary"
              onPress={() => addText.mutate({ body: '' })}
              fullWidth
            />
          </Field>

          <Button
            label={update.isPending ? '저장 중...' : '저장'}
            onPress={save}
            loading={update.isPending}
            fullWidth
          />
          <Pressable onPress={() => safeBack('/(tabs)/profile')} hitSlop={4}>
            <Text style={styles.cancelLink}>취소</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
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
  submit: { ...typography.bodyBold, color: colors.primary },

  bgSlot: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: '#F5F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bgIcon: { fontSize: 28, marginBottom: 4 },
  bgPlaceholder: { ...typography.caption, color: colors.textSecondary },
  bgEditOverlay: {
    position: 'absolute',
    bottom: space.sm,
    right: space.sm,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
  },
  bgEditText: { color: '#fff', ...typography.caption, fontWeight: '600' },

  avatarSlot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: '#F5F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarIcon: { fontSize: 24 },
  avatarPlaceholder: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 0 },

  channelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  channelIconImg: { width: 28, height: 28, borderRadius: 6 },

  blockList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  blockLabel: { ...typography.body, color: colors.textPrimary },
  toggle: { paddingVertical: 4, paddingHorizontal: space.md, borderRadius: radius.pill },
  toggleOn: { backgroundColor: colors.primary },
  toggleOff: { backgroundColor: colors.surfaceMuted },
  toggleText: { ...typography.caption, fontWeight: '600' },
  blockDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  blockDelete: { fontSize: 18, color: colors.danger, lineHeight: 18 },

  cancelLink: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

const fieldStyles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary },
});
