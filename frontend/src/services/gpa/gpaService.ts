// ─── Types ────────────────────────────────────────────────────────────────────

export interface GpaConfig {
  id: string;
  totalCourses: number;
  totalCredits: number;
  targetGpa: number;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  score: number;
  gradeLabel: string;
}

export interface Semester {
  id: string;
  semesterType: number;
  semesterLabel: string;
  courses: Course[];
  semesterGpa: number;
  totalCredits: number;
  ranking: string;
}

export interface AcademicYear {
  id: string;
  yearName: string;
  yearOrder: number;
  semesters: Semester[];
}

export interface GpaSummary {
  currentGpa: number;
  targetGpa: number;
  completedCredits: number;
  totalCredits: number;
  completedCourses: number;
  totalCourses: number;
  neededScore: number;
  overallRanking: string;
  academicYears: AcademicYear[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

import apiClient from '@/services/apiClient';

export const gpaService = {
  getSummary: async (): Promise<GpaSummary> => {
    const res = await apiClient.get('/gpa/summary');
    return res.data.data;
  },

  getConfig: async (): Promise<GpaConfig> => {
    const res = await apiClient.get('/gpa/config');
    return res.data.data;
  },

  upsertConfig: async (data: Omit<GpaConfig, 'id'>): Promise<GpaConfig> => {
    const res = await apiClient.put('/gpa/config', data);
    return res.data.data;
  },

  createYear: async (yearName: string, yearOrder: number): Promise<AcademicYear> => {
    const res = await apiClient.post('/gpa/years', { yearName, yearOrder });
    return res.data.data;
  },

  deleteYear: async (yearId: string) => {
    await apiClient.delete(`/gpa/years/${yearId}`);
  },

  updateYear: async (yearId: string, yearName: string, yearOrder: number): Promise<AcademicYear> => {
    const res = await apiClient.put(`/gpa/years/${yearId}`, { yearName, yearOrder });
    return res.data.data;
  },

  createSemester: async (academicYearId: string, semesterType: number): Promise<Semester> => {
    const res = await apiClient.post('/gpa/semesters', { academicYearId, semesterType });
    return res.data.data;
  },

  deleteSemester: async (semId: string) => {
    await apiClient.delete(`/gpa/semesters/${semId}`);
  },

  createCourse: async (data: {
    semesterId: string; courseCode: string; courseName: string; credits: number; score: number;
  }): Promise<Course> => {
    const res = await apiClient.post('/gpa/courses', data);
    return res.data.data;
  },

  updateCourse: async (courseId: string, data: {
    courseCode: string; courseName: string; credits: number; score: number;
  }): Promise<Course> => {
    const res = await apiClient.put(`/gpa/courses/${courseId}`, data);
    return res.data.data;
  },

  deleteCourse: async (courseId: string) => {
    await apiClient.delete(`/gpa/courses/${courseId}`);
  },
};
