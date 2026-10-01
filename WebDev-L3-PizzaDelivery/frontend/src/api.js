import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL}/api` });

// send the token with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if the token has expired, log out and go back to the login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      const wasAdmin = JSON.parse(localStorage.getItem('user') || '{}').role === 'admin';
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = wasAdmin ? '/admin/login' : '/login';
    }
    return Promise.reject(err);
  }
);

export function errorText(err) {
  return err.response?.data?.message || 'Could not reach the server. Check that the backend is running.';
}

export default api;
