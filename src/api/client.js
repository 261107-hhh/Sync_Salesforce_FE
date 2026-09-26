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

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('activeOrgId');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
