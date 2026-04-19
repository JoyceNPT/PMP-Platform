import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
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

// Response interceptor to handle 401 and refresh token logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Assume there is an endpoint to refresh token using the HttpOnly cookie
        // const res = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true, baseURL: apiClient.defaults.baseURL });
        // const newAccessToken = res.data.data.accessToken;
        // localStorage.setItem('accessToken', newAccessToken);
        // originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // For now, if 401, just return error and let the app handle logout
        // return apiClient(originalRequest);
        return Promise.reject(error);
      } catch (refreshError) {
        // Refresh token failed, clean up and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
