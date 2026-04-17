import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import styles from './AuthTokenModal.module.css';
import { Lock, User } from 'lucide-react';
import { restClient } from '../../core/api/restClient';

export const AuthTokenModal: React.FC = () => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const setToken = useAuthStore(state => state.setToken);
    const setDisplayName = useAuthStore(state => state.setDisplayName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState('');

    const handleEnter = async () => {
        if (!name.trim()) {
            setError('Please enter a display name to continue.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await restClient.getGhostToken();
            setDisplayName(name.trim());
            setToken(data.accessToken);
        } catch (err: any) {
            setError(err.message || "Encryption handshake failed.");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <Lock size={24} className={styles.icon} />
                    <h2 className="display-font">CIPHER SLATE</h2>
                </div>
                
                <p className={styles.description}>
                    A fully ephemeral, encrypted messaging subspace.
                </p>

                <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                        <User size={16} className={styles.inputIcon} />
                        <input
                            type="text"
                            className={styles.nameInput}
                            placeholder="Choose your alias..."
                            value={name}
                            onChange={e => { setName(e.target.value); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleEnter()}
                            maxLength={24}
                            autoFocus
                        />
                    </div>
                    <div className={styles.nameHint}>Your identity remains anonymous — this is only a display alias.</div>
                </div>

                {error && <div style={{ color: '#ff4c4c', fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '4px' }}>{error}</div>}

                <div className={styles.actions}>
                    <button onClick={handleEnter} className={styles.connectBtn} disabled={loading || !name.trim()}>
                        {loading ? 'CONNECTING...' : 'ENTER APP'}
                    </button>
                </div>
            </div>
        </div>
    );
};
