const API_BASE_URL = '/api';

export interface Room {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

export const restClient = {
  async getGhostToken(): Promise<{ accessToken: string, userId: string }> {
      const response = await fetch(`${API_BASE_URL}/auth/ghost`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to initialize ghost connection.");
      return await response.json();
  },

  async createRoom(token: string, name: string, type: string = "GROUP"): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, type })
    });

    if (!response.ok) {
        throw new Error(`Failed to create room: ${response.statusText}`);
    }

    return await response.json();
  },

  async joinRoom(token: string, roomId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/join`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to join room: ${response.statusText}`);
    }
  },

  async getRoomMeta(token: string, roomId: string): Promise<{ roomId: string, ownerId: string, participants: string[], name?: string, isPublic?: boolean }> {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/meta`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch room metadata");
    return await response.json();
  },
  async getPublicRooms(token: string): Promise<{ roomId: string, roomName: string, isPublic: boolean, participants: string[] }[]> {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/public`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch public rooms');
    return await response.json();
  }
};
