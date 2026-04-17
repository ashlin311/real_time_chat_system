import { create } from 'zustand';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface ChatMessage {
  id?: string;
  roomId: string;
  content: string;
  contentType: string;
  fileName?: string;
  senderId?: string;
  senderName?: string;
  timestamp?: number;
}

// Ensure unique keys for rendering if id doesn't exist
export const generateMessageId = () => Math.random().toString(36).substring(2, 9);

interface ChatState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
  messages: ChatMessage[];
  roomMeta: Record<string, { ownerId: string, participants: Set<string>, name?: string, isPublic?: boolean }>;
  addMessage: (msg: ChatMessage) => void;
  addParticipant: (roomId: string, userId: string) => void;
  removeParticipant: (roomId: string, userId: string) => void;
  setRoomMeta: (roomId: string, ownerId: string, participants: string[], name?: string, isPublic?: boolean) => void;
  clearMessages: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  nameCache: Record<string, string>; // userId -> displayName
  cacheName: (userId: string, name: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  status: 'DISCONNECTED',
  setStatus: (status) => set({ status }),
  messages: [],
  roomMeta: {},
  setRoomMeta: (roomId, ownerId, participants, name, isPublic) => set((state) => ({
      roomMeta: {
          ...state.roomMeta,
          [roomId]: {
              ownerId,
              participants: new Set(participants),
              name,
              isPublic
          }
      }
  })),
  addParticipant: (roomId, userId) => set((state) => {
    const room = state.roomMeta[roomId] || { ownerId: '', participants: new Set<string>(), name: undefined, isPublic: false };
    const newSet = new Set(room.participants);
    newSet.add(userId);
    return { roomMeta: { ...state.roomMeta, [roomId]: { ...room, participants: newSet } } };
  }),
  removeParticipant: (roomId, userId) => set((state) => {
    const room = state.roomMeta[roomId];
    if (!room) return state;
    const newSet = new Set(room.participants);
    newSet.delete(userId);
    return { roomMeta: { ...state.roomMeta, [roomId]: { ...room, participants: newSet } } };
  }),
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, { ...msg, id: msg.id || generateMessageId() }] 
  })),
  clearMessages: () => set({ messages: [] }),
  error: null,
  setError: (error) => set({ error, status: 'ERROR' }),
  nameCache: {},
  cacheName: (userId, name) => set((state) => ({
    nameCache: { ...state.nameCache, [userId]: name }
  })),
}));
