import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { AuthTokens } from '@kaza/shared';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/api-client';

interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isHydrated: false,

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    set({ isAuthenticated: Boolean(token), isHydrated: true });
  },

  setTokens: async (tokens) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    set({ isAuthenticated: true });
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ isAuthenticated: false });
  },
}));
