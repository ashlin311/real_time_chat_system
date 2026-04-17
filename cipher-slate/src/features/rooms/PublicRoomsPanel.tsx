import React, { useEffect, useState, useCallback } from 'react';
import { Globe, Users, RefreshCw, LogIn } from 'lucide-react';
import styles from './PublicRoomsPanel.module.css';
import { restClient } from '../../core/api/restClient';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';

interface PublicRoom {
  roomId: string;
  roomName: string;
  isPublic: boolean;
  participants: string[];
}

export const PublicRoomsPanel: React.FC = () => {
  const token = useAuthStore(s => s.token);
  const setActiveRoomId = useUIStore(s => s.setActiveRoomId);
  const addJoinedRoom = useUIStore(s => s.addJoinedRoom);
  const joinedRooms = useUIStore(s => s.joinedRooms);
  const setRoomMeta = useChatStore(s => s.setRoomMeta);

  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await restClient.getPublicRooms(token);
      setRooms(data);
    } catch (e) {
      console.error('Failed to fetch public rooms', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleJoin = async (room: PublicRoom) => {
    if (!token) return;
    // If already joined, just switch to it
    if (joinedRooms.includes(room.roomId)) {
      setActiveRoomId(room.roomId);
      return;
    }
    setJoiningId(room.roomId);
    try {
      await restClient.joinRoom(token, room.roomId);
      setRoomMeta(room.roomId, '', room.participants, room.roomName, true);
      addJoinedRoom(room.roomId);
      setActiveRoomId(room.roomId);
    } catch (e) {
      console.error('Failed to join room', e);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Globe size={16} />
          <span>PUBLIC CHANNELS</span>
        </div>
        <button className={styles.refreshBtn} onClick={fetchRooms} disabled={loading} title="Refresh">
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      <div className={styles.list}>
        {rooms.length === 0 && !loading && (
          <div className={styles.empty}>No public rooms active.<br />Create one to get started.</div>
        )}
        {rooms.map(room => {
          const isJoined = joinedRooms.includes(room.roomId);
          return (
            <div key={room.roomId} className={`${styles.roomCard} ${isJoined ? styles.joined : ''}`}>
              <div className={styles.roomInfo}>
                <span className={styles.roomName}>{room.roomName}</span>
                <span className={styles.roomMeta}>
                  <Users size={11} /> {room.participants?.length || 0} online
                </span>
              </div>
              <button
                className={`${styles.joinBtn} ${isJoined ? styles.joinBtnActive : ''}`}
                onClick={() => handleJoin(room)}
                disabled={joiningId === room.roomId}
              >
                {joiningId === room.roomId ? '...' : isJoined ? 'OPEN' : <><LogIn size={12} /> JOIN</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
