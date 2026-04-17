import { create } from 'zustand';

interface UIState {
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  isInfoPanelOpen: boolean;
  toggleInfoPanel: () => void;
  isCreateRoomModalOpen: boolean;
  setCreateRoomModalOpen: (open: boolean) => void;
  isJoinRoomModalOpen: boolean;
  setJoinRoomModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  isPublicRoomsOpen: boolean;
  setPublicRoomsOpen: (open: boolean) => void;
  joinedRooms: string[];
  addJoinedRoom: (roomId: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeRoomId: null,
  setActiveRoomId: (id) => set((state) => ({ 
      activeRoomId: id,
      joinedRooms: id && !state.joinedRooms.includes(id) ? [...state.joinedRooms, id] : state.joinedRooms
  })),
  isInfoPanelOpen: false,
  toggleInfoPanel: () => set((state) => ({ isInfoPanelOpen: !state.isInfoPanelOpen })),
  isCreateRoomModalOpen: false,
  setCreateRoomModalOpen: (open) => set({ isCreateRoomModalOpen: open }),
  isJoinRoomModalOpen: false,
  setJoinRoomModalOpen: (open) => set({ isJoinRoomModalOpen: open }),
  isSettingsModalOpen: false,
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
  isPublicRoomsOpen: false,
  setPublicRoomsOpen: (open) => set({ isPublicRoomsOpen: open }),
  joinedRooms: [],
  addJoinedRoom: (roomId) => set((state) => ({ 
      joinedRooms: state.joinedRooms.includes(roomId) ? state.joinedRooms : [...state.joinedRooms, roomId] 
  }))
}));
