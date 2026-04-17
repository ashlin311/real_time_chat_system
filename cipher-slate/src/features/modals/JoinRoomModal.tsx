import React, { useState } from 'react';
import { Key, X, Lock, ClipboardPaste, Shield } from 'lucide-react';
import styles from './JoinRoomModal.module.css';

import { restClient } from '../../core/api/restClient';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';

export const JoinRoomModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  
  const token = useAuthStore(s => s.token);
  const setActiveRoomId = useUIStore(s => s.setActiveRoomId);
  const setRoomMeta = useChatStore(s => s.setRoomMeta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (code.length < 5) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
        const sanitizedCode = code.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        await restClient.joinRoom(token, sanitizedCode);
        // Immediately seed the room name from meta for sidebar display
        try {
            const meta = await restClient.getRoomMeta(token, sanitizedCode);
            setRoomMeta(sanitizedCode, meta.ownerId, Array.from(meta.participants as any), meta.name, meta.isPublic);
        } catch (_) { /* non-fatal */ }
        useUIStore.getState().addJoinedRoom(sanitizedCode);
        setActiveRoomId(sanitizedCode);
        onClose();
    } catch (err: any) {
        setServerError(err.message || 'Room not found. Check the name or code.');
    } finally {
        setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${error ? styles.shake : ''}`}>
        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        
        <div className={styles.iconWrapper}>
          <Key size={24} />
        </div>
        
        <h2 className="display-font">Join Room</h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Room Signature</label>
            <div className={styles.inputWrapper}>
               <input 
                 type="text"
                 value={code}
                 onChange={(e) => {
                     setCode(e.target.value);
                     setError(false);
                 }}
                 placeholder="Enter room name or private code"
                 className={styles.input}
                 disabled={loading}
               />
               <Lock size={16} className={styles.inputIcon} />
            </div>
            {error && <span className={styles.errorText}>Invalid code format.</span>}
            {serverError && <span className={styles.errorText}>{serverError}</span>}
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => useUIStore.getState().setJoinRoomModalOpen(false)}>
                CANCEL
              </button>
              <button type="submit" className={styles.createBtn} disabled={loading || !code.trim()}>
                {loading ? 'CONNECTING...' : 'JOIN ROOM'}
              </button>
            </div>
          </div>
          
          <button type="button" onClick={handlePaste} className={styles.pasteBtn} disabled={loading}>
            <ClipboardPaste size={16} /> Paste Link
          </button>
        </form>
        
        <div className={styles.footer}>
          <Shield size={14} className={styles.shieldIcon} /> Your identity remains hidden.
        </div>
      </div>
    </div>
  );
};
