import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // ✅ This ensures cookies are sent with every request
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to ensure API prefix
api.interceptors.request.use(
  (config) => {
    console.log('🔐 API Request:', config.method?.toUpperCase(), config.url);

    // Ensure API calls go to /api prefix
    if (config.url && !config.url.startsWith('/api/') &&
      !config.url.startsWith('http') &&
      !config.url.includes('/uploads/')) {
      config.url = `/api${config.url}`;
      console.log('🔄 Rewriting URL to:', config.url);
    }

    // Ensure withCredentials is always true
    config.withCredentials = true;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error?.config?.url,
      status: error?.response?.status,
      message: error?.message
    });

    if (error?.response?.status === 401) {
      alert('Session expired or unauthorized. Please log in again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error?.response?.status === 403) {
      alert('Admin access required. Please log in as administrator.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;