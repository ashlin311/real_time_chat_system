import React, { useState } from 'react';
import { X, Copy, Check, ShieldAlert } from 'lucide-react';
import styles from './CreateRoomModal.module.css';

import { restClient } from '../../core/api/restClient';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export const CreateRoomModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [copied, setCopied] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [code, setCode] = useState('');
  
  const token = useAuthStore(s => s.token);
  const setActiveRoomId = useUIStore(s => s.setActiveRoomId);

  const handleCreate = async () => {
    if (name.length < 3) {
      setNameError(true);
      return;
    }
    if (!token) return;
    
    setLoading(true);
    setServerError('');
    try {
        const room = await restClient.createRoom(token, name, visibility);
        if (visibility === 'public') {
            useUIStore.getState().addJoinedRoom(room.id);
            setActiveRoomId(room.id);
            onClose();
        } else {
            setCode(room.id);
            setStep(2);
        }
    } catch (err: any) {
        setServerError(err.message || 'Failed to initialize room');
    } finally {
        setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        
        <h2 className="display-font">Create Room</h2>
        <p className={styles.subtitle}>START A TEMPORARY CHAT</p>
        
        {step === 1 ? (
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>ROOM NAME</label>
              <input 
                type="text" 
                placeholder="e.g. Shadow-Sector-9" 
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    setNameError(false);
                }}
                className={`${styles.input} ${nameError ? styles.inputError : ''}`}
              />
              {nameError && <span className={styles.errorText}>Name must be at least 3 characters.</span>}
            </div>

            <div className={styles.inputGroup}>
              <label>ROOM VISIBILITY</label>
              <div className={styles.toggleGroup}>
                <button 
                  className={`${styles.toggleBtn} ${visibility === 'public' ? styles.active : ''}`}
                  onClick={() => setVisibility('public')}
                >
                  Public
                </button>
                <button 
                  className={`${styles.toggleBtn} ${visibility === 'private' ? styles.active : ''}`}
                  onClick={() => setVisibility('private')}
                >
                  Private
                </button>
              </div>
            </div>

            {visibility === 'public' && (
              <div className={styles.warningBox}>
                <ShieldAlert size={16} className={styles.errorIcon} />
                <div>
                  <strong>SECURITY ALERT</strong>
                  <p>Public rooms can be scanned by metadata scrapers. Use Private mode for sensitive intel.</p>
                </div>
              </div>
            )}
            
            {serverError && <div className={styles.errorText} style={{marginBottom: 16}}>{serverError}</div>}
            
            <button className={styles.submitBtn} onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        ) : (
          <div className={styles.successState}>
            <div className={styles.codeBox}>
              <div className={styles.codeHeader}>
                <span>ROOM ACCESS CODE</span>
                <button className={styles.regenerateBtn}>REGENERATE</button>
              </div>
              <div className={styles.codeDisplay}>
                <span className={styles.code}>{code}</span>
                <button onClick={handleCopy} className={styles.copyBtn}>
                  {copied ? <Check size={20} className={styles.successIcon} /> : <Copy size={20} />}
                </button>
              </div>
              <p className={styles.codeWarning}>Code is required for room entry. Store securely; it cannot be recovered.</p>
            </div>
            
            <button className={styles.submitBtn} onClick={() => { setActiveRoomId(code); onClose(); }}>
              Enter Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
