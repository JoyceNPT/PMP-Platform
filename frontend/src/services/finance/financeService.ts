import apiClient from '@/services/apiClient';

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
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  type: number;
  amount: number;
  transactionDate: string;  // "YYYY-MM-DD"
  note?: string;
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
  createTransaction: async (data: Omit<Transaction, 'id' | 'categoryName' | 'categoryIcon' | 'categoryColor'>): Promise<Transaction> => {
    const res = await apiClient.post('/finance/transactions', data);
    return res.data.data;
  },
  updateTransaction: async (id: string, data: {
    categoryId: string; amount: number; transactionDate: string; note?: string;
  }): Promise<Transaction> => {
    const res = await apiClient.put(`/finance/transactions/${id}`, data);
    return res.data.data;
  },
  deleteTransaction: async (id: string) => apiClient.delete(`/finance/transactions/${id}`),

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
  getAiPrediction: async (): Promise<AiPrediction> => {
    const res = await apiClient.get('/finance/ai-prediction');
    return res.data.data;
  },

  // Reset
  resetAllData: async () => apiClient.delete('/finance/reset'),
};
