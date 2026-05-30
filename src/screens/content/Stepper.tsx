import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, space, typography } from '@/ui/tokens';

export const CONTENT_STEPS = ['플랫폼', '작물·일지', '생성 중', '결과'] as const;

export function ContentStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <View style={styles.row}>
      {CONTENT_STEPS.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        const showLine = i < CONTENT_STEPS.length - 1;
        return (
          <React.Fragment key={label}>
            <View style={styles.col}>
              <View
                style={[
                  styles.circle,
                  done && styles.circleDone,
                  active && styles.circleActive,
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    done && styles.circleTextDone,
                    active && styles.circleTextActive,
                  ]}
                >
                  {done ? '✓' : stepNum}
                </Text>
              </View>
              <Text style={[styles.label, (done || active) && styles.labelActive]}>{label}</Text>
            </View>
            {showLine ? <View style={[styles.line, done && styles.lineDone]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  col: { alignItems: 'center', gap: 4 },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  circleActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  circleText: { ...typography.caption, color: colors.textTertiary, fontWeight: '700' },
  circleTextDone: { color: '#fff' },
  circleTextActive: { color: colors.primary },
  label: { ...typography.caption, color: colors.textTertiary },
  labelActive: { color: colors.primary, fontWeight: '600' },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: space.xs,
    marginBottom: 16,
  },
  lineDone: { backgroundColor: colors.primary },
});
