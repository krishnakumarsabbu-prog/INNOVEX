import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('innovex_current_user_id');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // If the dev server or router returned index.html fallback instead of an API JSON payload
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      return Promise.reject(new Error('Received HTML response instead of JSON. Check API route.'));
    }
    return response;
  },
  (error) => {
    if (error.response?.data?.error) {
      return Promise.reject(new Error(error.response.data.error.message));
    }
    return Promise.reject(new Error(error.message || 'An error occurred'));
  }
);
