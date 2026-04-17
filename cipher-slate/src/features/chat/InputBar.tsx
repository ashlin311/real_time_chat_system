import React, { useState, useRef } from 'react';
import { Smile, Send, Paperclip } from 'lucide-react';
import styles from './InputBar.module.css';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { stompClient } from '../../core/api/stompClient';
import EmojiPicker from 'emoji-picker-react';

export const InputBar: React.FC = () => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const token = useAuthStore(s => s.token);
  const displayName = useAuthStore(s => s.displayName);
  const activeRoomId = useUIStore(s => s.activeRoomId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const senderName = displayName || 'Anonymous';

  const handleSend = () => {
    if (text.trim() && token && activeRoomId) {
      stompClient.sendMessage(token, activeRoomId, text, "TEXT", undefined, senderName);
      setText('');
      setShowEmoji(false);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !token || !activeRoomId) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const base64Content = ev.target?.result as string;
          let type = "FILE";
          if (file.type.startsWith("image/")) type = "IMAGE";
          else if (file.type.startsWith("video/")) type = "VIDEO";
          
          stompClient.sendMessage(token, activeRoomId, base64Content, type, file.name, senderName);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset
  };

  return (
    <div className={`${styles.container} glass`}>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
      <button className={styles.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={!activeRoomId}>
          <Paperclip size={20} />
      </button>
      
      <div style={{ flex: 1, position: 'relative' }}>
          {showEmoji && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '10px', zIndex: 50 }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
          )}
          <input 
            type="text" 
            className={styles.input} 
            placeholder="Type a message..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!activeRoomId}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'white' }}
          />
      </div>

      <div className={styles.actions}>
        <button className={styles.emojiBtn} onClick={() => setShowEmoji(!showEmoji)} disabled={!activeRoomId}>
            <Smile size={20} />
        </button>
        <button className={styles.sendBtn} onClick={handleSend} disabled={!text.trim() || !activeRoomId}>
          <Send size={18} className={styles.sendIcon} />
        </button>
      </div>
    </div>
  );
};
