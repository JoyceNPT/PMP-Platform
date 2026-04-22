import apiClient from './apiClient';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
  gender: z.number(), // 0: Male, 1: Female, 2: Other
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const authService = {
  login: async (data: LoginFormData & { recaptchaToken: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  
  register: async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await apiClient.post('/auth/google-login', `"${idToken}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/Auth/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/Auth/profile', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/Auth/forgot-password', `"${email}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  resetPassword: async (data: any) => {
    const response = await apiClient.post('/Auth/reset-password', data);
    return response.data;
  },

  verifyEmail: async (email: string, token: string) => {
    const response = await apiClient.get(`/Auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
    return response.data;
  }
};
