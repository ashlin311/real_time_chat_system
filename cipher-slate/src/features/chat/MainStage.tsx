import React, { useEffect, useRef, useState } from 'react';
import styles from './MainStage.module.css';
import { Search, Bell, BellOff, X } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

export const MainStage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const allMessages = useChatStore(s => s.messages);
  const activeRoomId = useUIStore(s => s.activeRoomId);
  const userId = useAuthStore(s => s.userId);
  const roomMetaDb = useChatStore(s => s.roomMeta);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mutedRooms = useSettingsStore(s => s.mutedRooms);
  const toggleRoomMute = useSettingsStore(s => s.toggleRoomMute);
  const isMuted = activeRoomId ? mutedRooms.includes(activeRoomId) : false;

  const displayedMessages = allMessages.filter(m => m.roomId === activeRoomId && (searchQuery.trim() === '' || m.content.toLowerCase().includes(searchQuery.toLowerCase())));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass`}>
        <div className={styles.headerInfo}>
          <h2 className="display-font">
              {activeRoomId ? `Room: ${roomMetaDb[activeRoomId]?.name || activeRoomId.substring(0, 8) + '...'}` : 'No Room Selected'}
          </h2>
          <div className={styles.membersOnline}>
            {activeRoomId && (
               <>
                 <span className={styles.statusDot} />
                 <span className={styles.statusText}>Secure Channel Active</span>
               </>
            )}
          </div>
        </div>
        
        <div className={styles.headerActions}>
          {isSearching ? (
             <div className={styles.searchContainer}>
                 <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                 />
                 <button className={styles.iconBtn} onClick={() => { setIsSearching(false); setSearchQuery(''); }}><X size={16} /></button>
             </div>
          ) : (
            <button className={styles.iconBtn} onClick={() => setIsSearching(true)}><Search size={20} /></button>
          )}
          <div className={styles.youIndicator}>You: {userId ? userId.substring(0,6) : ''}</div>
          {activeRoomId && (
            <button 
              className={styles.iconBtn} 
              onClick={() => toggleRoomMute(activeRoomId)}
              title={isMuted ? "Unmute Room" : "Mute Room"}
            >
              {isMuted ? <BellOff size={20} color="var(--on-surface-variant)" /> : <Bell size={20} />}
            </button>
          )}
        </div>
      </header>

      <div className={styles.messageList} ref={scrollRef}>
        <div className={styles.messageHistory}>
           {activeRoomId ? (
              displayedMessages.length === 0 ? (
                 <div style={{ textAlign: 'center', opacity: 0.5, margin: '2rem 0', fontFamily: 'var(--font-mono)' }}>Room empty. Awaiting messages...</div>
              ) : (
                displayedMessages.map(msg => (
                  <MessageBubble 
                    key={msg.id}
                    sender={msg.senderName || (msg.senderId ? msg.senderId.substring(0, 8) : 'Anonymous')}
                    time={new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    content={msg.content}
                    contentType={msg.contentType}
                    fileName={msg.fileName}
                    isOwn={userId !== null && msg.senderId === userId}
                  />
                ))
              )
           ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', marginTop: '10vh' }}>
                   <h3 style={{ fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '1rem', letterSpacing: '2px' }}>NO ACTIVE ROOM</h3>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                       <button onClick={() => useUIStore.getState().setCreateRoomModalOpen(true)} style={{ padding: '12px 24px', fontSize: '1rem', background: 'var(--accent-blue)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Create Room</button>
                       <button onClick={() => useUIStore.getState().setJoinRoomModalOpen(true)} style={{ padding: '12px 24px', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Join Room</button>
                   </div>
                </div>
           )}
        </div>
      </div>

      <footer className={styles.footer}>
        <InputBar />
      </footer>
    </div>
  );
};
