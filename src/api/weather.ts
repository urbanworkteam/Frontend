import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';
import { WeatherSnapshot } from '@/types/diary';

export function useWeather(farmLocationId: number | null, date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['weather', farmLocationId, date],
    enabled: enabled && !!farmLocationId,
    queryFn: async () => {
      const res = await api.get<ApiResponse<WeatherSnapshot>>('/api/v1/weather', {
        params: { farmLocationId, date },
      });
      return unwrap(Promise.resolve(res));
    },
    staleTime: 60 * 60_000,
  });
}
