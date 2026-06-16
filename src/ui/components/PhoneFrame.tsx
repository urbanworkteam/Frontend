import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';

const DEFAULT_PHONE_WIDTH = 340;
const PHONE_HEIGHT = 720;
const BEZEL_RADIUS = 44;
const BEZEL_WIDTH = 8;
const WIDTH_STEP = 20;
const MIN_WIDTH = 280;
const MAX_WIDTH = 480;

/**
 * 웹에서만 폰 프레임(테두리)을 렌더링하는 래퍼.
 * 모바일(네이티브)에서는 children 을 그대로 반환합니다.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [phoneWidth, setPhoneWidth] = useState(DEFAULT_PHONE_WIDTH);

  // 스크롤바 완전히 숨기는 CSS 삽입
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = `
      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      *::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const narrower = () => setPhoneWidth((w) => Math.max(MIN_WIDTH, w - WIDTH_STEP));
  const wider = () => setPhoneWidth((w) => Math.min(MAX_WIDTH, w + WIDTH_STEP));

  return (
    <View style={styles.background}>
      {/* 가로 크기 조정 버튼 */}
      <View style={styles.controls}>
        <Pressable onPress={narrower} style={styles.btn}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.sizeLabel}>{phoneWidth}px</Text>
        <Pressable onPress={wider} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>

      <View style={[styles.device, { width: phoneWidth + BEZEL_WIDTH * 2 }]}>
        {/* 앱 콘텐츠 */}
        <View style={styles.screen}>{children}</View>
        {/* 홈 인디케이터 */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as unknown as number,
    paddingTop: 40,
    paddingBottom: 40,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  sizeLabel: {
    fontSize: 13,
    color: '#666',
    minWidth: 50,
    textAlign: 'center',
  },
  device: {
    height: PHONE_HEIGHT + BEZEL_WIDTH * 2,
    borderWidth: 8,
    borderColor: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    borderRadius: BEZEL_RADIUS,
    padding: BEZEL_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    borderRadius: BEZEL_RADIUS - BEZEL_WIDTH,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: BEZEL_WIDTH + 8,
    left: '50%' as unknown as number,
    marginLeft: -67,
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CCC',
    zIndex: 10,
  },
});
