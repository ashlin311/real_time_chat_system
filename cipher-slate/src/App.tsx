
import { MainLayout } from './core/layout/MainLayout';
import { AuthTokenModal } from './features/modals/AuthTokenModal';
import { CreateRoomModal } from './features/modals/CreateRoomModal';
import { JoinRoomModal } from './features/modals/JoinRoomModal';
import { SettingsModal } from './features/modals/SettingsModal';
import { useUIStore } from './store/uiStore';

function App() {
  const isCreateOpen = useUIStore(s => s.isCreateRoomModalOpen);
  const setCreateOpen = useUIStore(s => s.setCreateRoomModalOpen);
  const isJoinOpen = useUIStore(s => s.isJoinRoomModalOpen);
  const setJoinOpen = useUIStore(s => s.setJoinRoomModalOpen);
  const isSettingsOpen = useUIStore(s => s.isSettingsModalOpen);
  const setSettingsOpen = useUIStore(s => s.setSettingsModalOpen);

  return (
    <>
      <AuthTokenModal />
      {isCreateOpen && <CreateRoomModal onClose={() => setCreateOpen(false)} />}
      {isJoinOpen && <JoinRoomModal onClose={() => setJoinOpen(false)} />}
      {isSettingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <MainLayout />
    </>
  );
}

export default App;
