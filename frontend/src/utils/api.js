import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Use the global axios instance instead of creating a new one
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    // Ensure Authorization header is set from global axios defaults
    if (axios.defaults.headers.common['Authorization'] && !config.headers.Authorization) {
      config.headers.Authorization = axios.defaults.headers.common['Authorization'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const stocksApi = {
  getAllStocks: () => api.get('/stocks'),
  getStockHistory: (ticker, period = '1D', granularity = 'minute') =>
    api.get(`/stocks/${ticker}/history`, {
      params: { period, granularity }
    }),
  getUserPortfolio: (userId) => api.get(`/users/${userId}/portfolio`),
  getPortfolioHistory: (userId, period = '1D', granularity = 'minute') =>
    api.get(`/users/${userId}/portfolio/history`, {
      params: { period, granularity }
    }),
  updatePortfolio: (userId, data) => api.post(`/users/${userId}/portfolio`, data),
  buyStock: (ticker, quantity) => api.post('/buy', { ticker, quantity }),
  sellStock: (ticker, quantity) => api.post('/sell', { ticker, quantity }),
  getUserData: (userId) => api.get(`/user/${userId}`),
  getLeaderboard: () => api.get('/leaderboard'),
  getHealth: () => api.get('/health'),
};

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  getSession: () => api.get('/auth/session'),
  authJsLogout: () => api.post('/auth/signout'),
};

export default api;
