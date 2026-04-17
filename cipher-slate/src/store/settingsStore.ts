import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  audioEnabled: boolean;
  notificationsEnabled: boolean;
  mutedRooms: string[];
  setAudioEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleRoomMute: (roomId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioEnabled: true,
      notificationsEnabled: false,
      mutedRooms: [],
      setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      toggleRoomMute: (roomId) => set((state) => ({
          mutedRooms: state.mutedRooms.includes(roomId) 
              ? state.mutedRooms.filter(id => id !== roomId) 
              : [...state.mutedRooms, roomId]
      }))
    }),
    {
      name: 'cipher-slate-settings', 
    }
  )
);
