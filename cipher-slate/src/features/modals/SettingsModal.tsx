import React, { useEffect, useState } from 'react';
import { X, Bell, Volume2, ShieldAlert, Flame } from 'lucide-react';
import styles from './SettingsModal.module.css';
import { useSettingsStore } from '../../store/settingsStore';

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { audioEnabled, setAudioEnabled, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
     if ('Notification' in window) {
         setNotificationStatus(Notification.permission);
     }
  }, []);

  const requestNotificationPermission = async () => {
     if (!('Notification' in window)) {
         alert("This browser does not support desktop notifications.");
         return;
     }

     if (Notification.permission !== 'granted') {
         const permission = await Notification.requestPermission();
         setNotificationStatus(permission);
         if (permission === 'granted') {
             setNotificationsEnabled(true);
         }
     } else {
         setNotificationsEnabled(!notificationsEnabled);
     }
  };

  const handleBurn = () => {
      // Ephemeral cleanup block
      localStorage.clear();
      window.location.reload();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        
        <h2 className="display-font" style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
           <ShieldAlert size={24} color="var(--accent-blue)" /> SYSTEM PREFERENCES
        </h2>

        <div className={styles.settingsList}>
            
            <div className={styles.settingItem}>
                <div className={styles.settingMeta}>
                    <div className={styles.settingTitle}><Volume2 size={16} /> Incoming Sonar Audio</div>
                    <div className={styles.settingDesc}>Play a soft chime when you receive a message in the active session.</div>
                </div>
                <label className={styles.toggle}>
                    <input type="checkbox" checked={audioEnabled} onChange={() => setAudioEnabled(!audioEnabled)} />
                    <span className={styles.slider}></span>
                </label>
            </div>

            <div className={styles.settingItem}>
                <div className={styles.settingMeta}>
                    <div className={styles.settingTitle}><Bell size={16} /> Desktop Push Notifications</div>
                    <div className={styles.settingDesc}>
                       {notificationStatus === 'denied' 
                          ? 'Blocked globally. Enable in browser settings.'
                          : 'Receive an OS-level notification when someone messages you while tabbed out.'}
                    </div>
                </div>
                {notificationStatus === 'granted' ? (
                   <label className={styles.toggle}>
                       <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} />
                       <span className={styles.slider}></span>
                   </label>
                ) : (
                   <button className={styles.secondaryBtn} onClick={requestNotificationPermission} disabled={notificationStatus === 'denied'}>
                       Enable Native Push
                   </button>
                )}
            </div>

        </div>

        <div className={styles.dangerZone}>
            <div className={styles.dangerHeader}>CRITICAL PROTOCOLS</div>
            <p className={styles.dangerText}>Instantly erase your UUID from local memory and completely detach your connection tree. Your identity will permanently vanish from active channels instantly.</p>
            <button className={styles.burnBtn} onClick={handleBurn}>
                <Flame size={16} style={{marginRight: '8px'}} /> BURN SESSION AND RELOAD
            </button>
        </div>
      </div>
    </div>
  );
};
