import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useConfirmCheckout } from '@/api/subscription';
import { env } from '@/config/env';
import { colors, space, typography } from '@/ui/tokens';
import { toast } from '@/state/uiStore';

export default function CheckoutScreen() {
  const { checkoutId, merchantUid, amount, plan } = useLocalSearchParams<{
    checkoutId: string;
    merchantUid: string;
    amount: string;
    plan: string;
  }>();
  const confirm = useConfirmCheckout();
  const webRef = useRef<WebView>(null);

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
      <WebView ref={webRef} originWhitelist={['*']} source={{ html }} onMessage={onMessage} style={{ flex: 1 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  back: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.title, color: colors.textPrimary },
});
