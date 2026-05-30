import React, { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { Button } from '@/ui/components/Button';
import { useConfirmCheckout } from '@/api/subscription';
import { env } from '@/config/env';
import { colors, radius, shadow, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

// react-native-webview 는 native-only 모듈. 웹에서는 import 시점에 throw.
// Platform 분기로 native 에서만 require.
type WebViewModule = typeof import('react-native-webview');
const WebViewModule: WebViewModule | null =
  Platform.OS !== 'web' ? require('react-native-webview') : null;

export default function CheckoutScreen() {
  const { checkoutId, merchantUid, amount, plan } = useLocalSearchParams<{
    checkoutId: string;
    merchantUid: string;
    amount: string;
    plan: string;
  }>();
  const confirm = useConfirmCheckout();
  const webRef = useRef<unknown>(null);

  // 웹에서는 결제 화면 띄울 수 없음 — 안내 화면.
  if (Platform.OS === 'web' || !WebViewModule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => safeBack('/(tabs)/mypage/subscription')}>
            <Text style={styles.back}>← 취소</Text>
          </Pressable>
          <Text style={styles.title}>결제</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.webFallback}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <Text style={styles.fallbackTitle}>결제는 모바일 앱에서 진행해주세요</Text>
          <Text style={styles.fallbackSub}>
            포트원 결제 SDK 는 모바일(iOS/Android) 앱 환경에서만 동작합니다.{'\n'}
            웹 브라우저에서는 결제 화면을 띄울 수 없어요.
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>플랜</Text>
              <Text style={styles.summaryValue}>{plan}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>결제 금액</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ₩{Number(amount).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>주문번호</Text>
              <Text style={styles.summaryMono} numberOfLines={1}>
                {merchantUid}
              </Text>
            </View>
          </View>

          <Button
            label="← 플랜 목록으로"
            variant="secondary"
            onPress={() => safeBack('/(tabs)/mypage/subscription')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  const { WebView } = WebViewModule;
  type WebViewMessageEvent = import('react-native-webview').WebViewMessageEvent;

  const html = `
<!doctype html>
<html lang="ko">
<head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif">
  <h3>결제 진행</h3>
  <p>${plan} · ₩${Number(amount).toLocaleString()}</p>
  <p>merchant_uid: <code>${merchantUid}</code></p>
  <button id="pay" style="background:#2BA651;color:#fff;border:none;padding:14px 24px;border-radius:8px;font-size:16px;width:100%">결제하기</button>
  <button id="cancel" style="background:#fff;color:#111;border:1px solid #E5E7EB;padding:14px 24px;border-radius:8px;font-size:16px;width:100%;margin-top:8px">취소</button>
  <script src="https://cdn.iamport.kr/v1/iamport.js"></script>
  <script>
    IMP.init('${env.portoneImpCode || 'imp00000000'}');
    document.getElementById('pay').onclick = function() {
      IMP.request_pay({
        pg: 'html5_inicis',
        pay_method: 'card',
        merchant_uid: '${merchantUid}',
        name: 'Farmily ${plan}',
        amount: ${amount},
      }, function(rsp) {
        window.ReactNativeWebView.postMessage(JSON.stringify(rsp));
      });
    };
    document.getElementById('cancel').onclick = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ canceled: true }));
    };
  </script>
</body>
</html>`;

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.canceled) {
        safeBack('/(tabs)/mypage/subscription');
        return;
      }
      if (!data.success) {
        toast.error(data.error_msg ?? '결제 실패');
        safeBack('/(tabs)/mypage/subscription');
        return;
      }
      confirm.mutate(
        { checkoutId: parseInt(checkoutId, 10), impUid: data.imp_uid, merchantUid: data.merchant_uid },
        {
          onSuccess: () => {
            toast.success('결제가 완료되었습니다');
            router.replace('/(tabs)/mypage/subscription');
          },
          onError: (err) => {
            toast.error((err as Error).message);
            safeBack('/(tabs)/mypage/subscription');
          },
        },
      );
    } catch {
      toast.error('결제 결과 파싱 실패');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack('/(tabs)/mypage/subscription')}><Text style={styles.back}>← 취소</Text></Pressable>
        <Text style={styles.title}>결제</Text>
        <View style={{ width: 50 }} />
      </View>
      <WebView
        ref={webRef as React.Ref<import('react-native-webview').WebView>}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
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

  // 웹 fallback
  webFallback: {
    flex: 1,
    padding: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  iconText: { fontSize: 40 },
  fallbackTitle: { ...typography.header, color: colors.textPrimary, textAlign: 'center' },
  fallbackSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: space.lg,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
    marginBottom: space.lg,
    ...shadow.card,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.bodyBold, color: colors.textPrimary },
  summaryMono: {
    ...typography.caption,
    color: colors.textTertiary,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    maxWidth: '60%',
  },
});
