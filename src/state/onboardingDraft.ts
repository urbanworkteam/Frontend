import { create } from 'zustand';
import { OnboardingRequest } from '@/api/auth';

type CropEntry = OnboardingRequest['crops'][number];

type DraftState = {
  step: number;
  handle: string;
  farmDisplayName: string;
  region: string;
  farmingMethod: string;
  crops: CropEntry[];
  locationLabel: string;
  locationAddress: string;
  locationLat: number | null;
  locationLng: number | null;
  setStep: (n: number) => void;
  setField: <K extends keyof DraftState>(k: K, v: DraftState[K]) => void;
  addCrop: (name: string) => void;
  removeCrop: (name: string) => void;
  reset: () => void;
  toRequest: () => OnboardingRequest;
};

export const useOnboardingDraft = create<DraftState>((set, get) => ({
  step: 0,
  handle: '',
  farmDisplayName: '',
  region: '',
  farmingMethod: '',
  crops: [],
  locationLabel: '1번 농장',
  locationAddress: '',
  locationLat: null,
  locationLng: null,
  setStep: (n) => set({ step: n }),
  setField: (k, v) => set({ [k]: v } as Partial<DraftState>),
  addCrop: (name) =>
    set((s) =>
      s.crops.some((c) => c.name === name) ? s : { crops: [...s.crops, { name }] },
    ),
  removeCrop: (name) => set((s) => ({ crops: s.crops.filter((c) => c.name !== name) })),
  reset: () =>
    set({
      step: 0,
      handle: '',
      farmDisplayName: '',
      region: '',
      farmingMethod: '',
      crops: [],
      locationLabel: '1번 농장',
      locationAddress: '',
      locationLat: null,
      locationLng: null,
    }),
  toRequest: () => {
    const s = get();
    if (s.locationLat == null || s.locationLng == null) {
      throw new Error('농장 위치 좌표가 없습니다. 위치를 다시 감지해주세요.');
    }
    return {
      handle: s.handle,
      farmDisplayName: s.farmDisplayName,
      region: s.region || undefined,
      farmingMethod: s.farmingMethod || undefined,
      crops: s.crops.length ? s.crops : [],
      farmLocation: {
        label: s.locationLabel || '1번 농장',
        address: s.locationAddress,
        lat: s.locationLat,
        lng: s.locationLng,
      },
    };
  },
}));
