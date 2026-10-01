import { apiClient } from './client';

export interface NotificationCreate {
  recipient_email: string;
  subject: string;
}

export interface NotificationResponse {
  id: string;
  recipient_email: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  triggered_at: string;
}

export const triggerNotification = async (data: NotificationCreate): Promise<NotificationResponse> => {
  return apiClient<NotificationResponse>('/notifications/trigger', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getNotifications = async (): Promise<NotificationResponse[]> => {
  return apiClient<NotificationResponse[]>('/notifications');
};
