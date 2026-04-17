import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import styles from './RoomInfoPanel.module.css';
import { Copy, Check, ShieldAlert } from 'lucide-react';

export const RoomInfoPanel: React.FC = () => {
    const activeRoomId = useUIStore(state => state.activeRoomId);
    const roomMetaDb = useChatStore(state => state.roomMeta);
    const nameCache = useChatStore(state => state.nameCache);
    const meta = activeRoomId ? roomMetaDb[activeRoomId] : null;
    const roomParticipants = meta ? Array.from(meta.participants) : [];
    const ownerId = meta ? meta.ownerId : null;
    const userId = useAuthStore(state => state.userId);
    const displayName = useAuthStore(state => state.displayName);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      if (activeRoomId) {
        navigator.clipboard.writeText(activeRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <div className={`${styles.panel} glass`}>
        <div className={styles.header}>
            <h3 style={{fontFamily: 'var(--font-mono)', fontSize: '0.85rem', opacity: 0.7, letterSpacing: '2px'}}>ROOM METADATA</h3>
        </div>
        <div className={styles.section}>
          <div className={styles.signatureBox}>
            <div className={styles.statusSection}>
              <div className={styles.statusIndicator} />
              <span className={styles.code}>{activeRoomId ? `#${activeRoomId.substring(0, 12)}` : 'None'}</span>
            </div>
            <button className={styles.copyBtn} onClick={handleCopy} disabled={!activeRoomId}>
                 {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            </button>
          </div>
          
          <div className={styles.encryptionBadge}>
            <ShieldAlert size={16} color="var(--accent-blue)" />
            <span style={{fontWeight: 500}}>End-to-End Encrypted</span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.participantsSection}>
            <h4 className={styles.sectionTitle}>PARTICIPANTS</h4>
            <div className={styles.participantList}>
              {activeRoomId ? (
                   <>
                    <div className={styles.participant}>
                      <span className={styles.statusDot} /> {displayName || 'You'}
                      {userId === ownerId && <span style={{fontSize: '0.65rem', padding: '2px 6px', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', borderRadius: '4px', marginLeft: 'auto'}}>OWNER</span>}
                    </div>
                    {roomParticipants.filter(id => id !== userId).map(pid => (
                        <div key={pid} className={styles.participant}>
                            <span className={styles.statusDot} style={{backgroundColor: 'var(--accent-blue)'}} /> {nameCache[pid] || pid.substring(0,8)}
                            {pid === ownerId && <span style={{fontSize: '0.65rem', padding: '2px 6px', border: '1px solid var(--on-surface-variant)', color: 'var(--on-surface-variant)', borderRadius: '4px', marginLeft: 'auto'}}>OWNER</span>}
                        </div>
                    ))}
                   </>
              ) : (
                <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '0.85rem' }}>
                Awaiting connection...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.verifiedBox}>
             <ShieldAlert size={14} style={{marginRight: '8px', opacity: 0.5}}/>
             <span>Strictly Ephemeral </span>
             <p style={{marginTop: '4px', opacity: 0.5, fontSize: '0.75rem', lineHeight: 1.4}}>Contents decay immediately upon session termination.</p>
          </div>
        </div>
      </div>
    );
};
