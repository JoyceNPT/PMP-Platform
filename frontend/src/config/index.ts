/**
 * Central configuration for the frontend application.
 * All environment variables are gathered here for easy management.
 */

export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5259/api',
  
  RECAPTCHA: {
    SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  },
  
  GOOGLE: {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  },
  
  YOUTUBE: {
    API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || '',
  },
  
  GEMINI: {
    API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  },
};
