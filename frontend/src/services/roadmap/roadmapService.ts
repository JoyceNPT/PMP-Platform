import apiClient from '@/services/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserSkill {
  id: string;
  skillName: string;
  skillType: number;        // 0=Current, 1=Planned
  proficiencyLevel?: number; // 0-4
}

export interface UserCareerProfile {
  id: string;
  major: string;
  currentJob?: string;
  experienceYears?: number;
  skills: UserSkill[];
}

export interface RoadmapNode {
  id: string;
  nodeKey: string;
  title: string;
  description?: string;
  category?: string;
  orderIndex: number;
  positionX?: number;
  positionY?: number;
  status: number;           // 0=NotStarted, 1=InProgress, 2=Completed
  note?: string;
  certificateUrl?: string;
  prerequisiteKeys: string[];
}

export interface CareerRoadmap {
  id: string;
  careerPath: string;
  source: number;           // 0=RoadmapSh, 1=AiGenerated
  isActive: boolean;
  rawData: string;
  nodes: RoadmapNode[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const roadmapService = {
  // Profile
  getProfile: async (): Promise<UserCareerProfile> => {
    const res = await apiClient.get('/roadmap/profile');
    return res.data.data;
  },
  updateProfile: async (data: Partial<UserCareerProfile>): Promise<UserCareerProfile> => {
    const res = await apiClient.put('/roadmap/profile', data);
    return res.data.data;
  },
  
  // Skills
  addSkill: async (data: Omit<UserSkill, 'id'>): Promise<UserSkill> => {
    const res = await apiClient.post('/roadmap/skills', data);
    return res.data.data;
  },
  deleteSkill: async (id: string) => apiClient.delete(`/roadmap/skills/${id}`),

  // Roadmap
  getActiveRoadmap: async (): Promise<CareerRoadmap> => {
    const res = await apiClient.get('/roadmap/active');
    return res.data.data;
  },
  generateAiRoadmap: async (careerPath: string, targetLevel: number): Promise<CareerRoadmap> => {
    const res = await apiClient.post('/roadmap/generate', { careerPath, targetLevel });
    return res.data.data;
  },
  deleteRoadmap: async (id: string) => apiClient.delete(`/roadmap/${id}`),

  // Progress
  updateProgress: async (data: { nodeId: string; status: number; note?: string; certificateUrl?: string }) => {
    const res = await apiClient.put('/roadmap/progress', data);
    return res.data.data;
  },
};
