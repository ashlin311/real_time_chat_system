import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { Plus, LogIn } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
    const joinedRooms = useUIStore(state => state.joinedRooms);
    const activeRoomId = useUIStore(state => state.activeRoomId);
    const setActiveRoomId = useUIStore(state => state.setActiveRoomId);
    const allMessages = useChatStore(state => state.messages);
    const roomMetaDb = useChatStore(state => state.roomMeta);

    return (
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h2 className="display-font">ACTIVE SESSIONS</h2>
        </div>
        
        <div className={styles.roomList}>
          {joinedRooms.length === 0 ? (
             <div style={{ padding: '1rem', opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center' }}>
                No rooms joined.
             </div>
          ) : (
             joinedRooms.map(roomId => {
                 const roomMsgs = allMessages.filter(m => m.roomId === roomId);
                 const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;

                 let previewText = 'Tap to enter room';
                 if (lastMsg) {
                     if (lastMsg.contentType === 'SYSTEM') previewText = lastMsg.content;
                     else if (lastMsg.fileName) previewText = `[File] ${lastMsg.fileName}`;
                     else previewText = lastMsg.content;
                 }

                 return (
                   <button 
                     key={roomId} 
                     onClick={() => setActiveRoomId(roomId)}
                     className={`${styles.roomItem} ${activeRoomId === roomId ? styles.active : ''}`}
                   >
                     <div className={styles.roomHeader}>
                       <span className={styles.roomName}>{roomMetaDb[roomId]?.name || roomId.substring(0, 12) + '...'}</span>
                       <span className={styles.roomTime}>
                           {lastMsg ? new Date(lastMsg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Live'}
                       </span>
                     </div>
                     <div className={styles.roomPreview} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: (activeRoomId !== roomId && lastMsg) ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                       {previewText}
                     </div>
                   </button>
                 );
             })
          )}
        </div>
        
        <div className={styles.footer}>
          <button className={styles.newChatBtn} onClick={() => useUIStore.getState().setCreateRoomModalOpen(true)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>
            <Plus size={16} style={{marginRight: '8px'}}/> Create Room
          </button>
          <button className={styles.newChatBtn} onClick={() => useUIStore.getState().setJoinRoomModalOpen(true)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', marginTop: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>
            <LogIn size={16} style={{marginRight: '8px'}}/> Join Room
          </button>
        </div>
      </div>
    );
};
