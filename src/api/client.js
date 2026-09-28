import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT Bearer token and active Organization ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const activeOrgId = localStorage.getItem('activeOrgId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (activeOrgId) {
    config.headers['X-Organization-ID'] = activeOrgId;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to catch API errors and trigger highlighted alerts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Determine friendly and prominent error message
    let errorMessage = 'Network / API Request Failed';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (typeof errorMessage === 'object') {
      try {
        errorMessage = JSON.stringify(errorMessage);
      } catch (e) {
        errorMessage = 'Unknown request error';
      }
    }

    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method ? error.config.method.toUpperCase() : 'GET';

    // Broadcast API error event so the UI can prominently highlight the message
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: {
          message: String(errorMessage),
          status,
          url,
          method,
          timestamp: Date.now()
        }
      }));
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('activeOrgId');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;
