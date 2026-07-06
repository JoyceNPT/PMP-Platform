import apiClient from '@/services/apiClient';
import * as signalR from '@microsoft/signalr';
import { CONFIG } from '@/config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinanceCategory {
  id: string;
  name: string;
  type: number;         // 0=Income, 1=Expense
  colorHex?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  ownerUserId: string;
  ownerName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  type: number;
  amount: number;
  transactionDate: string;  // "YYYY-MM-DD"
  note?: string;
  attachmentUrl?: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  status: number;           // 0=InProgress, 1=Completed, 2=Cancelled
  progressPercent: number;
  remainingAmount: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  colorHex?: string;
  icon?: string;
  amount: number;
  percent: number;
}

export interface DailyAmount { day: number; amount: number; }
export interface MonthlyTrend { label: string; income: number; expense: number; }

export interface MonthlySummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  expenseBreakdown: CategoryBreakdown[];
  incomeBreakdown: CategoryBreakdown[];
  dailyExpenses: DailyAmount[];
  monthlyTrend: MonthlyTrend[];
}

export interface AiPrediction {
  predictedAmount: number;
  confidence?: number;
  insight: string;
  month: string;
}

export interface FinanceGroupMember {
  userId: string;
  displayName: string;
  email?: string;
  status: number;
  joinedAt: string;
}

export interface FinanceGroup {
  id: string;
  name: string;
  createdByUserId: string;
  members: FinanceGroupMember[];
}

export interface FinanceGroupInvite {
  id: string;
  financeGroupId: string;
  groupName: string;
  inviterUserId: string;
  inviterName: string;
  inviteeUserId: string;
  inviteeName: string;
  status: number;
  expiresAt: string;
  createdAt: string;
}

export interface FinanceSharingOverview {
  inviteCode: string;
  activeGroup?: FinanceGroup | null;
  incomingInvites: FinanceGroupInvite[];
  outgoingInvites: FinanceGroupInvite[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const financeService = {
  // Categories
  getCategories: async (): Promise<FinanceCategory[]> => {
    const res = await apiClient.get('/finance/categories');
    return res.data.data;
  },
  createCategory: async (data: Omit<FinanceCategory, 'id'>): Promise<FinanceCategory> => {
    const res = await apiClient.post('/finance/categories', data);
    return res.data.data;
  },
  updateCategory: async (id: string, data: { name: string; colorHex?: string; icon?: string; }): Promise<FinanceCategory> => {
    const res = await apiClient.put(`/finance/categories/${id}`, data);
    return res.data.data;
  },
  deleteCategory: async (id: string) => apiClient.delete(`/finance/categories/${id}`),

  // Transactions
  getTransactions: async (params?: {
    month?: number; year?: number; type?: number; categoryId?: string; page?: number;
  }): Promise<Transaction[]> => {
    const res = await apiClient.get('/finance/transactions', { params });
    return res.data.data;
  },
  createTransaction: async (data: Omit<Transaction, 'id' | 'ownerUserId' | 'ownerName' | 'categoryName' | 'categoryIcon' | 'categoryColor'>): Promise<Transaction> => {
    const res = await apiClient.post('/finance/transactions', data);
    return res.data.data;
  },
  updateTransaction: async (id: string, data: {
    categoryId: string; amount: number; transactionDate: string; note?: string; attachmentUrl?: string;
  }): Promise<Transaction> => {
    const res = await apiClient.put(`/finance/transactions/${id}`, data);
    return res.data.data;
  },
  deleteTransaction: async (id: string) => apiClient.delete(`/finance/transactions/${id}`),
  uploadFinanceAttachment: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/upload', formData, {
      params: { feature: 'finance' },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // Saving Goals
  getSavingGoals: async (): Promise<SavingGoal[]> => {
    const res = await apiClient.get('/finance/saving-goals');
    return res.data.data;
  },
  createSavingGoal: async (data: {
    name: string; targetAmount: number; currentAmount: number; targetDate?: string;
  }): Promise<SavingGoal> => {
    const res = await apiClient.post('/finance/saving-goals', data);
    return res.data.data;
  },
  updateSavingGoal: async (id: string, data: {
    name: string; targetAmount: number; currentAmount: number; targetDate?: string; status: number;
  }): Promise<SavingGoal> => {
    const res = await apiClient.put(`/finance/saving-goals/${id}`, data);
    return res.data.data;
  },
  deleteSavingGoal: async (id: string) => apiClient.delete(`/finance/saving-goals/${id}`),

  // Summary & AI
  getMonthlySummary: async (year?: number, month?: number): Promise<MonthlySummary> => {
    const res = await apiClient.get('/finance/summary', { params: { year, month } });
    return res.data.data;
  },
  getAiPrediction: async (forceReload: boolean = false, scope: 'personal' | 'group' = 'group'): Promise<AiPrediction> => {
    const res = await apiClient.get('/finance/ai-prediction', { params: { forceReload, scope } });
    return res.data.data;
  },

  // Reset
  resetAllData: async () => apiClient.delete('/finance/reset'),

  // Sharing
  getSharingOverview: async (): Promise<FinanceSharingOverview> => {
    const res = await apiClient.get('/finance/sharing');
    return res.data.data;
  },
  createGroupInvite: async (inviteCode: string): Promise<FinanceGroupInvite> => {
    const res = await apiClient.post('/finance/sharing/invites', { inviteCode });
    return res.data.data;
  },
  acceptGroupInvite: async (id: string) => apiClient.post(`/finance/sharing/invites/${id}/accept`),
  rejectGroupInvite: async (id: string) => apiClient.post(`/finance/sharing/invites/${id}/reject`),
  cancelGroupInvite: async (id: string) => apiClient.post(`/finance/sharing/invites/${id}/cancel`),
  leaveActiveGroup: async () => apiClient.post('/finance/sharing/leave'),
  updateActiveGroup: async (name: string): Promise<FinanceGroup> => {
    const res = await apiClient.put('/finance/sharing/group', { name });
    return res.data.data;
  },
};

let financeHubConnection: signalR.HubConnection | null = null;

export const financeHub = {
  start: async (token: string, onChanged: () => void) => {
    if (financeHubConnection) {
      financeHubConnection.off('FinanceSharingChanged');
      financeHubConnection.off('FinanceInviteReceived');
      financeHubConnection.off('FinanceInviteAccepted');
      financeHubConnection.off('FinanceInviteRejected');
      financeHubConnection.on('FinanceSharingChanged', onChanged);
      financeHubConnection.on('FinanceInviteReceived', onChanged);
      financeHubConnection.on('FinanceInviteAccepted', onChanged);
      financeHubConnection.on('FinanceInviteRejected', onChanged);
      return;
    }

    const baseUrl = CONFIG.API_BASE_URL.replace(/\/api$/, '');
    financeHubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/finance`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    financeHubConnection.on('FinanceSharingChanged', onChanged);
    financeHubConnection.on('FinanceInviteReceived', onChanged);
    financeHubConnection.on('FinanceInviteAccepted', onChanged);
    financeHubConnection.on('FinanceInviteRejected', onChanged);

    try {
      await financeHubConnection.start();
    } catch (err) {
      console.error('Finance SignalR connection error:', err);
    }
  },
  stop: async () => {
    if (financeHubConnection) {
      await financeHubConnection.stop();
      financeHubConnection = null;
    }
  },
};
