import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add cart session for guest users
    const cartSession = Cookies.get('cart_session');
    if (cartSession) {
      config.headers['x-cart-session'] = cartSession;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          Cookies.set('accessToken', accessToken, { expires: 1 });
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 });

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          delete api.defaults.headers.common['Authorization'];
          
          // Redirect to login if on protected page
          if (typeof window !== 'undefined') {
            const protectedPaths = ['/account', '/checkout', '/orders'];
            if (protectedPaths.some(path => window.location.pathname.startsWith(path))) {
              window.location.href = '/login';
            }
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// Utility functions
export const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const formatPrice = (price: number, currency: string = 'ILS') => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};
