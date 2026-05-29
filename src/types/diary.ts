export type WorkType =
  | 'TILLAGE'
  | 'IRRIGATION'
  | 'SEEDING'
  | 'WEEDING'
  | 'HARVEST'
  | 'OTHER_FARMING'
  | 'DAILY';

export type WorkTypeMeta = { code: WorkType; label: string; icon: string };

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
