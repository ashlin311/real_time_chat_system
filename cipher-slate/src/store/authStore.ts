import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userId: string | null;
  displayName: string | null;
  setToken: (token: string | null) => void;
  setDisplayName: (name: string) => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  userId: null,
  displayName: null,
  setToken: (token) => {
    let userId = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || null;
      } catch (err) {
        console.error("Failed to parse JWT token", err);
      }
    }
    set({ token, userId, isAuthenticated: !!token });
  },
  setDisplayName: (name) => set({ displayName: name.trim() || null }),
  isAuthenticated: false,
}));
