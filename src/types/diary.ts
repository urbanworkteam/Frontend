export type WorkType =
  | 'TILLAGE'
  | 'IRRIGATION'
  | 'SEEDING'
  | 'WEEDING'
  | 'HARVEST'
  | 'OTHER_FARMING'
  | 'DAILY';

export type WorkTypeMeta = { code: WorkType; label: string; icon: string };

// 백엔드 GET /diaries/work-types 의 응답을 그대로 박아둔 fallback. enum 기반이라
// 거의 정적. API 호출이 실패해도 일지 작성을 막지 않도록 useWorkTypes 가 fallback.
export const FALLBACK_WORK_TYPES: WorkTypeMeta[] = [
  { code: 'TILLAGE', label: '경운', icon: '🌱' },
  { code: 'IRRIGATION', label: '관수', icon: '💧' },
  { code: 'SEEDING', label: '파종·모내기', icon: '🌾' },
  { code: 'WEEDING', label: '제초', icon: '✂️' },
  { code: 'HARVEST', label: '수확', icon: '🧺' },
  { code: 'OTHER_FARMING', label: '기타 농업활동', icon: '🚜' },
  { code: 'DAILY', label: '하루 일상', icon: '🙂' },
];

export type WeatherSnapshot = {
  main: string | null;
  tempMax: number | null;
  tempMin: number | null;
  precipitationMm: number | null;
  humidityPct: number | null;
  source: 'AUTO' | 'MANUAL' | 'KMA';
};

export type DiaryWorkBlock = { id?: number; workType: WorkType; detail?: string | null; sortOrder?: number };
export type DiaryPhoto = { id: number; url: string; sortOrder: number };

export type DiaryResponse = {
  id: number;
  date: string;
  farmLocation: { id: number; label: string } | null;
  crop: { id: number; name: string; colorHex: string } | null;
  weather: WeatherSnapshot;
  workBlocks: DiaryWorkBlock[];
  memo: string | null;
  photos: DiaryPhoto[];
  createdAt: string;
  updatedAt: string;
};

export type CalendarMonth = {
  days: { date: string; tags: { crop: string; color: string; workType: WorkType }[] }[];
};
