import axios from 'axios';
import { CONFIG } from '@/config';
import { useAuthStore } from '@/store/authStore';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For receiving HttpOnly cookies (refresh token)
});

// Request interceptor to add the access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let refreshPromise: Promise<string> | null = null;

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return [
    '/auth/login',
    '/auth/google-login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/Auth/forgot-password',
    '/Auth/reset-password',
    '/Auth/verify-email',
  ].some(endpoint => url.includes(endpoint));
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${CONFIG.API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true })
      .then((res) => {
        const newAccessToken = res.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        useAuthStore.getState().setAccessToken(newAccessToken);
        return newAccessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Response interceptor to handle 401 and refresh token logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-token') &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, clean up and redirect to login
        await useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
