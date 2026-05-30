import { router } from 'expo-router';

// router.back() 직접 호출은 stack 비어있을 때(deep link / router.replace 진입 후)
// "GO_BACK was not handled by any navigator" warning + 무동작. 안전한 fallback 패턴.
//
// 사용:
//   import { safeBack } from '@/lib/nav';
//   <Pressable onPress={() => safeBack('/(tabs)/diary')} />
//
// fallback 은 그 화면이 속한 탭의 index 또는 자연스러운 상위 화면.
export function safeBack(fallback: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
