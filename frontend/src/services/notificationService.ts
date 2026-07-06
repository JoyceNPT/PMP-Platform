import * as signalR from '@microsoft/signalr';
import { CONFIG } from '@/config';
import apiClient from '@/services/apiClient';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: number;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await apiClient.get('/notifications');
    return res.data.data;
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data.data;
  },
  markAsRead: async (id: string) => apiClient.post(`/notifications/${id}/read`),
  markAllAsRead: async () => apiClient.post('/notifications/read-all'),
  deleteNotification: async (id: string) => apiClient.delete(`/notifications/${id}`),
};

let notificationHubConnection: signalR.HubConnection | null = null;

export const notificationHub = {
  start: async (token: string, onReceived: () => void) => {
    if (notificationHubConnection) {
      notificationHubConnection.off('NotificationReceived');
      notificationHubConnection.on('NotificationReceived', onReceived);
      return;
    }

    const baseUrl = CONFIG.API_BASE_URL.replace(/\/api$/, '');
    notificationHubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    notificationHubConnection.on('NotificationReceived', onReceived);

    try {
      await notificationHubConnection.start();
    } catch (err) {
      console.error('Notification SignalR connection error:', err);
    }
  },
  stop: async () => {
    if (notificationHubConnection) {
      await notificationHubConnection.stop();
      notificationHubConnection = null;
    }
  },
};
