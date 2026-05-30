import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse, PageResponse } from './types';
import { CalendarMonth, DiaryResponse, WorkTypeMeta } from '@/types/diary';

export type WriteDiaryBody = {
  date: string;
  farmLocationId: number;
  cropId: number;
  weather: {
    source: 'AUTO' | 'MANUAL';
    main?: string | null;
    tempMax?: number | null;
    tempMin?: number | null;
    precipitationMm?: number | null;
    humidityPct?: number | null;
  };
  workBlocks: { workType: string; detail?: string | null }[];
  memo?: string | null;
  photoKeys?: string[];
};

export function useDiaryCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['diary-calendar', year, month],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CalendarMonth>>('/api/v1/diaries/calendar', {
        params: { year, month },
      });
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useDiary(id: number | null) {
  return useQuery({
    queryKey: ['diary', id],
    enabled: id !== null && id > 0,
    queryFn: async () => {
      const res = await api.get<ApiResponse<DiaryResponse>>(`/api/v1/diaries/${id}`);
      return unwrap(Promise.resolve(res));
    },
  });
}

// 작물별 / 기간 영농일지 목록 (콘텐츠 Step 2 일지 선택용).
// 미지정 시 백엔드가 오늘 기준 최근 90일 기본 적용. cursor 페이지네이션.
export function useDiaryListByCrop(
  cropId: number | null,
  opts?: { fromDate?: string; toDate?: string; limit?: number },
) {
  return useQuery({
    queryKey: ['diary-by-crop', cropId, opts],
    enabled: cropId !== null && cropId > 0,
    queryFn: async () => {
      const res = await api.get<ApiResponse<PageResponse<DiaryResponse>>>('/api/v1/diaries', {
        params: { cropId, ...opts },
      });
      return unwrap(Promise.resolve(res));
    },
  });
}

// 백엔드 영농일지 캘린더 응답에는 diary id가 없어서, 날짜별 단건 조회용
// 명함 캘린더 endpoint를 재사용한다. 동일 데이터에 id 포함.
export function useDiariesByDate(date: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['diaries-by-date', date],
    enabled: enabled && !!date,
    queryFn: async () => {
      const res = await api.get<ApiResponse<DiaryResponse[]>>(
        `/api/v1/me/profile/calendar/${date}`,
      );
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useWorkTypes() {
  // staleTime: Infinity 였던 게 첫 호출 실패 시 영영 lock 되는 문제.
  // 1시간으로 줄이고 retry 2회 — 토큰 hydrate 직후 401 받았어도 자연스럽게 복구.
  return useQuery({
    queryKey: ['work-types'],
    staleTime: 60 * 60_000,
    retry: 2,
    queryFn: async () => {
      const res = await api.get<ApiResponse<WorkTypeMeta[]>>('/api/v1/diaries/work-types');
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useWriteDiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: WriteDiaryBody) => {
      const res = await api.post<ApiResponse<DiaryResponse>>('/api/v1/diaries', body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary-calendar'] });
    },
  });
}

export function useUpdateDiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: WriteDiaryBody }) => {
      const res = await api.patch<ApiResponse<DiaryResponse>>(`/api/v1/diaries/${id}`, body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['diary', vars.id] });
      qc.invalidateQueries({ queryKey: ['diary-calendar'] });
    },
  });
}

export function useDeleteDiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/diaries/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary-calendar'] });
    },
  });
}
