import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, User } from '../../shared/types';
import { TokenStorage } from '../utils/token_storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (authResponse: AuthResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (authResponse: AuthResponse) => {
        
        const { access_token, refresh_token, user } = authResponse;
        
        // Sync with TokenStorage
        if (access_token) {
            TokenStorage.saveToken(access_token);
        }
        if (refresh_token) {
            TokenStorage.saveRefreshToken(refresh_token);
        }
        if (user) {
            TokenStorage.saveUserData(user);
        }
        
        set({
          user: user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      logout: () => {
        console.log('Logging out...');
        TokenStorage.clearAll();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
