import { create } from 'zustand';

type ToastKind = 'info' | 'success' | 'error';

type ToastPayload = {
  message: string;
  kind?: ToastKind;
  durationMs?: number;
};

type UiState = {
  toast: ToastPayload | null;
  showToast: (t: ToastPayload) => void;
  dismissToast: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  showToast: (toast) => set({ toast }),
  dismissToast: () => set({ toast: null }),
}));

export const toast = {
  info: (message: string) => useUiStore.getState().showToast({ message, kind: 'info' }),
  success: (message: string) => useUiStore.getState().showToast({ message, kind: 'success' }),
  error: (message: string) => useUiStore.getState().showToast({ message, kind: 'error' }),
};
