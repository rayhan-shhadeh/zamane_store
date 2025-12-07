import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens
          Cookies.set('accessToken', accessToken, { expires: 1 });
          Cookies.set('refreshToken', refreshToken, { expires: 7 });

          // Update API default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', data);
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens
          Cookies.set('accessToken', accessToken, { expires: 1 });
          Cookies.set('refreshToken', refreshToken, { expires: 7 });

          // Update API default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignore errors on logout
        }

        // Clear tokens
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        delete api.defaults.headers.common['Authorization'];

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

          Cookies.set('accessToken', newAccessToken, { expires: 1 });
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 });

          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        } catch (error) {
          // If refresh fails, logout
          get().logout();
        }
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      fetchUser: async () => {
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.user });
        } catch (error) {
          // If fetching user fails, might need to logout
        }
      },
    }),
    {
      name: 'zamane-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app load
if (typeof window !== 'undefined') {
  const accessToken = Cookies.get('accessToken');
  if (accessToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    useAuthStore.getState().fetchUser();
  }
}
