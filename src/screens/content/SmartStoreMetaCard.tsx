import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StoreMeta } from '@/api/ai';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';

export function SmartStoreMetaCard({ meta }: { meta: StoreMeta }) {
  const metrics = [
    { label: '당도', value: meta.brix },
    { label: '수확 발송', value: meta.harvestPolicy },
    { label: '재배 경력', value: meta.farmingYears },
  ].filter((m) => !!m.value);

  const productEntries = meta.productInfo ? Object.entries(meta.productInfo) : [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🛒 상품 소개</Text>

      {metrics.length > 0 ? (
        <View style={styles.metricRow}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.metric}>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {meta.reasonsToBuy && meta.reasonsToBuy.length > 0 ? (
        <View style={styles.reasonsBox}>
          <Text style={styles.reasonsTitle}>선택해야 하는 이유</Text>
          {meta.reasonsToBuy.map((r, i) => (
            <View key={i} style={styles.reasonRow}>
              <Text style={styles.reasonNum}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.reasonText}>{r}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {productEntries.length > 0 ? (
        <View style={styles.productTable}>
          <Text style={styles.productTitle}>상품 정보</Text>
          {productEntries.map(([k, v]) => (
            <View key={k} style={styles.productRow}>
              <Text style={styles.productKey}>{k}</Text>
              <Text style={styles.productVal}>{v}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {typeof meta.price === 'number' && meta.price > 0 ? (
        <View style={styles.priceBar}>
          <Text style={styles.priceLabel}>오늘 주문 · 내일 새벽 수확</Text>
          <Text style={styles.priceValue}>₩{meta.price.toLocaleString()}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    gap: space.md,
    ...shadow.card,
  },
  title: { ...typography.title, color: colors.textPrimary },

  // metrics
  metricRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F9F4',
    borderRadius: radius.md,
    paddingVertical: space.md,
  },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { ...typography.header, color: colors.primary },
  metricLabel: { ...typography.caption, color: colors.textSecondary },

  // reasons
  reasonsBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  reasonsTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: space.xs },
  reasonRow: { flexDirection: 'row', gap: space.md },
  reasonNum: { ...typography.bodyBold, color: colors.primary, width: 24 },
  reasonText: { ...typography.body, color: colors.textPrimary, flex: 1 },

  // product info
  productTable: { gap: space.xs },
  productTitle: { ...typography.bodyBold, color: colors.textSecondary, marginBottom: space.xs },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productKey: { ...typography.body, color: colors.textSecondary },
  productVal: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },

  // price
  priceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6F4EA',
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.xs,
  },
  priceLabel: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  priceValue: { ...typography.header, color: colors.primary },
});
