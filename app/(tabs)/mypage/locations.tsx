import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { safeBack } from '@/lib/nav';
import {
  FarmLocation,
  useCreateFarmLocation,
  useDeleteFarmLocation,
  useFarmLocations,
  useUpdateFarmLocation,
} from '@/api/farmLocation';
import { Button } from '@/ui/components/Button';
import { TextInput } from '@/ui/components/TextInput';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

type Coords = { lat: number; lng: number } | null;

async function captureCurrentCoords(): Promise<Coords> {
  const Location = await import('expo-location');
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    toast.error('위치 권한이 필요해요. 권한 허용 후 다시 시도해주세요.');
    return null;
  }
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    toast.error('GPS 신호를 받지 못했어요. 실내라면 야외로 이동 후 재시도해주세요.');
    return null;
  }
}

function formatCoords(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return '좌표 없음';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function LocationsManageScreen() {
  const locs = useFarmLocations();
  const create = useCreateFarmLocation();
  const update = useUpdateFarmLocation();
  const del = useDeleteFarmLocation();

  // 신규 추가 폼
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<Coords>(null);
  const [detecting, setDetecting] = useState(false);

  // 인라인 편집 중인 카드 id
  const [editingId, setEditingId] = useState<number | null>(null);

  const onDetect = async () => {
    setDetecting(true);
    const c = await captureCurrentCoords();
    setDetecting(false);
    if (c) {
      setCoords(c);
      toast.success('현재 위치를 감지했어요');
    }
  };

  const add = () => {
    if (!label.trim() || !address.trim() || !coords) return;
    create.mutate(
      { label: label.trim(), address: address.trim(), lat: coords.lat, lng: coords.lng },
      {
        onSuccess: () => {
          setLabel('');
          setAddress('');
          setCoords(null);
          toast.success('농장 위치가 추가되었습니다');
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack('/(tabs)/mypage')}>
          <Text style={styles.back}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.title}>농장 위치</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        {/* 신규 추가 카드 */}
        <View style={styles.addCard}>
          <Text style={styles.addCardTitle}>+ 농장 위치 추가</Text>
          <Text style={styles.guide}>
            농장에 도착하신 후 등록해주세요. GPS 좌표로 날씨 자동 입력이 동작합니다.
          </Text>

          <TextInput label="라벨" value={label} onChangeText={setLabel} placeholder="2번 농장" />
          <TextInput
            label="주소 (디지털 명함 표시용)"
            value={address}
            onChangeText={setAddress}
            placeholder="전남 나주시 평산리"
            multiline
          />

          <Pressable
            style={[styles.detectCard, coords && styles.detectCardSuccess]}
            onPress={detecting ? undefined : onDetect}
          >
            <View style={styles.detectIconWrap}>
              {detecting ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.detectIcon}>{coords ? '✓' : '📍'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detectTitle}>
                {detecting ? '위치 감지 중...' : coords ? '현재 위치 감지됨' : '현재 위치 사용'}
              </Text>
              <Text style={styles.detectSub}>
                {coords
                  ? `📍 ${formatCoords(coords.lat, coords.lng)}`
                  : '탭하면 GPS로 위·경도를 잡습니다'}
              </Text>
            </View>
            {coords ? <Text style={styles.detectRetry}>재시도</Text> : null}
          </Pressable>

          <Button
            label="+ 추가"
            onPress={add}
            disabled={!label.trim() || !address.trim() || !coords}
            loading={create.isPending}
            fullWidth
          />
        </View>

        {/* 목록 */}
        {locs.isLoading ? <ActivityIndicator /> : null}
        {(locs.data ?? []).map((l) =>
          editingId === l.id ? (
            <EditCard
              key={l.id}
              location={l}
              onCancel={() => setEditingId(null)}
              onSave={async (body) => {
                try {
                  await update.mutateAsync({ id: l.id, body });
                  toast.success('수정되었습니다');
                  setEditingId(null);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              saving={update.isPending}
            />
          ) : (
            <View key={l.id} style={styles.card}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.cardLabel}>{l.label}</Text>
                <Text style={styles.cardAddress}>{l.address}</Text>
                <Text style={styles.cardCoords}>📍 {formatCoords(l.lat, l.lng)}</Text>
                {l.kmaGridX !== null ? (
                  <Text style={styles.cardMeta}>
                    KMA 격자: ({l.kmaGridX}, {l.kmaGridY})
                  </Text>
                ) : (
                  <Text style={[styles.cardMeta, { color: colors.warning }]}>
                    격자 변환 실패 — 날씨 자동 입력 불가
                  </Text>
                )}
              </View>
              <View style={{ gap: space.xs, alignItems: 'flex-end' }}>
                <Pressable onPress={() => setEditingId(l.id)} hitSlop={8}>
                  <Text style={styles.edit}>✎ 편집</Text>
                </Pressable>
                <Pressable onPress={() => del.mutate(l.id)} hitSlop={8}>
                  <Text style={styles.delete}>삭제</Text>
                </Pressable>
              </View>
            </View>
          ),
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EditCard({
  location,
  onCancel,
  onSave,
  saving,
}: {
  location: FarmLocation;
  onCancel: () => void;
  onSave: (body: { label: string; address: string; lat?: number; lng?: number }) => void;
  saving: boolean;
}) {
  const [label, setLabel] = useState(location.label);
  const [address, setAddress] = useState(location.address);
  const [coords, setCoords] = useState<Coords>(
    location.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null,
  );
  const [detecting, setDetecting] = useState(false);
  const [coordsTouched, setCoordsTouched] = useState(false);

  const onDetect = async () => {
    setDetecting(true);
    const c = await captureCurrentCoords();
    setDetecting(false);
    if (c) {
      setCoords(c);
      setCoordsTouched(true);
      toast.success('현재 위치를 감지했어요');
    }
  };

  const save = () => {
    if (!label.trim() || !address.trim()) return;
    const body: { label: string; address: string; lat?: number; lng?: number } = {
      label: label.trim(),
      address: address.trim(),
    };
    // 좌표는 사용자가 재감지 했을 때만 PATCH 에 포함 — 그 외에는 기존 값 유지.
    if (coordsTouched && coords) {
      body.lat = coords.lat;
      body.lng = coords.lng;
    }
    onSave(body);
  };

  return (
    <View style={styles.addCard}>
      <Text style={styles.addCardTitle}>✎ 농장 위치 편집</Text>
      <TextInput label="라벨" value={label} onChangeText={setLabel} />
      <TextInput label="주소" value={address} onChangeText={setAddress} multiline />

      <Pressable
        style={[styles.detectCard, coordsTouched && coords && styles.detectCardSuccess]}
        onPress={detecting ? undefined : onDetect}
      >
        <View style={styles.detectIconWrap}>
          {detecting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.detectIcon}>📍</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detectTitle}>
            {coordsTouched ? '새 위치 감지됨' : '현재 위치로 갱신'}
          </Text>
          <Text style={styles.detectSub}>
            {coords ? `📍 ${formatCoords(coords.lat, coords.lng)}` : '좌표 없음'}
          </Text>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="취소" variant="secondary" onPress={onCancel} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="저장"
            onPress={save}
            disabled={!label.trim() || !address.trim()}
            loading={saving}
            fullWidth
          />
        </View>
      </View>
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

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: radius.md,
    ...shadow.card,
  },
  addCard: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    gap: space.md,
    ...shadow.card,
  },
  addCardTitle: { ...typography.bodyBold, color: colors.textPrimary },
  guide: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },

  cardLabel: { ...typography.bodyBold, color: colors.textPrimary },
  cardAddress: { ...typography.caption, color: colors.textSecondary },
  cardCoords: { ...typography.caption, color: colors.textPrimary, marginTop: 2 },
  cardMeta: { ...typography.small, color: colors.textTertiary },

  edit: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  delete: { ...typography.caption, color: colors.danger },

  detectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  detectCardSuccess: { backgroundColor: '#E6F4EA', borderColor: colors.primary },
  detectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectIcon: { fontSize: 18, color: colors.primary },
  detectTitle: { ...typography.bodyBold, color: colors.textPrimary },
  detectSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  detectRetry: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
