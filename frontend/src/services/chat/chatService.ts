import apiClient from '@/services/apiClient';
import * as signalR from '@microsoft/signalr';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  role: number;           // 0=User, 1=Assistant, 2=System
  content: string;
  contentType: number;    // 0=Text, 1=Markdown, 2=Image
  attachmentUrl?: string;
  isStreaming: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title?: string;
  type: number;           // 0=AI, 1=Admin
  lastMessageAt?: string;
  lastMessage?: Partial<Message>;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get('/chat/conversations');
    return res.data.data;
  },
  createConversation: async (data: { type: number; initialMessage?: string }): Promise<Conversation> => {
    const res = await apiClient.post('/chat/conversations', data);
    return res.data.data;
  },
  deleteConversation: async (id: string) => apiClient.delete(`/chat/conversations/${id}`),

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return res.data.data;
  },
  sendMessage: async (data: { conversationId: string; content: string; attachmentUrl?: string }): Promise<Message> => {
    const res = await apiClient.post('/chat/messages', data);
    return res.data.data;
  },
};

// ─── SignalR Helper ───────────────────────────────────────────────────────────

let hubConnection: signalR.HubConnection | null = null;

export const chatHub = {
  start: async (token: string, onMessageReceived: (msg: Message) => void) => {
    if (hubConnection) {
      hubConnection.off('ReceiveMessage');
      hubConnection.on('ReceiveMessage', onMessageReceived);
      return;
    }

    hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/chat', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    hubConnection.on('ReceiveMessage', (message: Message) => {
      onMessageReceived(message);
    });

    try {
      await hubConnection.start();
      console.log('SignalR Connected.');
    } catch (err) {
      console.error('SignalR Connection Error: ', err);
    }
  },
  stop: async () => {
    if (hubConnection) {
      await hubConnection.stop();
      hubConnection = null;
    }
  },
  joinConversation: async (id: string) => {
    if (hubConnection?.state === signalR.HubConnectionState.Connected) {
      await hubConnection.invoke('JoinConversation', id);
    }
  },
  leaveConversation: async (id: string) => {
    if (hubConnection?.state === signalR.HubConnectionState.Connected) {
      await hubConnection.invoke('LeaveConversation', id);
    }
  }
};
