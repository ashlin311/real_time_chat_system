import { MessageSquare, Globe, Download, Settings } from 'lucide-react';
import styles from './NavRail.module.css';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

export const NavRail: React.FC = () => {
  const setSettingsOpen = useUIStore(s => s.setSettingsModalOpen);
  const setPublicRoomsOpen = useUIStore(s => s.setPublicRoomsOpen);
  const isPublicRoomsOpen = useUIStore(s => s.isPublicRoomsOpen);
  const displayName = useAuthStore(s => s.displayName);
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
    : 'DG';
  return (
    <nav className={styles.rail}>
      <div className={styles.logo}>DG</div>
      
      <div className={styles.iconGroup}>
        <button
          className={`${styles.iconBtn} ${!isPublicRoomsOpen ? styles.active : ''}`}
          onClick={() => setPublicRoomsOpen(false)}
          title="Chat Sessions"
        >
          <MessageSquare size={20} />
        </button>
        <button
          className={`${styles.iconBtn} ${isPublicRoomsOpen ? styles.active : ''}`}
          onClick={() => setPublicRoomsOpen(true)}
          title="Public Channels"
        >
          <Globe size={20} />
        </button>
        <button className={styles.iconBtn}><Download size={20} /></button>
      </div>
      
      <div className={styles.spacer} />
      
      <div className={styles.iconGroup}>
        <button className={styles.iconBtn} onClick={() => setSettingsOpen(true)}>
           <Settings size={20} />
        </button>
        <div className={styles.monogram} title={displayName || 'Guest'}>{initials}</div>
      </div>
    </nav>
  );
};
