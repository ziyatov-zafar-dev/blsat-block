
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../types';

interface AuthStore extends AuthState {
  setAuth: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: User | null) => void;
  setDeviceId: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      deviceId: localStorage.getItem('X-Device-Id'),
      user: null,
      setAuth: (tokens) => set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setUser: (user) => set({ user }),
      setDeviceId: (id) => set({ deviceId: id }),
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // We keep deviceId
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        user: state.user 
      }),
    }
  )
);
