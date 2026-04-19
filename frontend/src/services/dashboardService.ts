import apiClient from './apiClient';

export interface DashboardOverview {
  currentGpa: number;
  gpaRanking: string;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsProgress: number;
  completedRoadmapNodes: number;
  totalRoadmapNodes: number;
}

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const res = await apiClient.get('/dashboard/overview');
    return res.data.data;
  }
};
