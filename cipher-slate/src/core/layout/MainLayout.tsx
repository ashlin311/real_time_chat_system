import React from 'react';
import styles from './MainLayout.module.css';
import { NavRail } from '../../features/layout/NavRail';
import { Sidebar } from '../../features/rooms/Sidebar';
import { PublicRoomsPanel } from '../../features/rooms/PublicRoomsPanel';
import { MainStage } from '../../features/chat/MainStage';
import { RoomInfoPanel } from '../../features/rooms/RoomInfoPanel';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useUIStore } from '../../store/uiStore';

export const MainLayout: React.FC = () => {
  useRealtimeSync();
  const isPublicRoomsOpen = useUIStore(s => s.isPublicRoomsOpen);

  return (
    <div className={styles.container}>
      <nav className={styles.navRail}>
        <NavRail />
      </nav>

      <aside className={styles.sidebar}>
        {isPublicRoomsOpen ? <PublicRoomsPanel /> : <Sidebar />}
      </aside>

      <main className={styles.mainStage}>
        <MainStage />
      </main>

      <aside className={styles.infoPanel}>
        <RoomInfoPanel />
      </aside>
    </div>
  );
};
