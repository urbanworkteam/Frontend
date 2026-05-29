import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';

export type NotificationSettings = {
  pushEnabled: boolean;
  diaryReminderEnabled: boolean;
  trendPushEnabled: boolean;
  marketingPushEnabled: boolean;
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NotificationSettings>>('/api/v1/notification-settings');
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<NotificationSettings>) => {
      const res = await api.patch<ApiResponse<NotificationSettings>>('/api/v1/notification-settings', body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-settings'] }),
  });
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: async (body: { platform: 'IOS' | 'ANDROID'; token: string }) => {
      await api.post('/api/v1/push-tokens', body);
    },
  });
}
