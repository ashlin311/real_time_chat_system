import React from 'react';
import { Check, CheckCheck, Clock, Download } from 'lucide-react';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  sender: string;
  time: string;
  content: string;
  contentType?: string;
  fileName?: string;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  sender, 
  time, 
  content, 
  contentType = 'TEXT',
  fileName,
  isOwn,
  status
}) => {

  const renderContent = () => {
      if (contentType === 'IMAGE') {
          return <img src={content} alt="Media" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} />;
      }
      if (contentType === 'VIDEO') {
          return <video src={content} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} />;
      }
      if (contentType === 'FILE') {
          return (
             <a href={content} download={fileName || "attachment"} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '4px' }}>
                 <Download size={18} /> {fileName ? fileName : 'Download Attachment'}
             </a>
          );
      }
      return <>{content}</>;
  };

  return (
    <div className={contentType === 'SYSTEM' ? styles.systemWrapper : `${styles.wrapper} ${isOwn ? styles.isOwn : ''}`}>
      {contentType === 'SYSTEM' ? (
          <div style={{ textAlign: 'center', width: '100%', fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontStyle: 'italic', margin: '8px 0' }}>
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{sender}</span> {content}
      </div>
      ) : (
          <>
              {!isOwn && (
                <div className={styles.header}>
                  <span className={styles.sender}>{sender}</span>
                </div>
              )}
              <div className={styles.bubble} style={contentType !== 'TEXT' ? { background: 'transparent', padding: 0 } : {}}>
                <div className={styles.content}>
                  {renderContent()}
                </div>
              </div>
              <div className={styles.meta}>
                <span className={styles.time}>{time}</span>
                {isOwn && status && (
                  <span className={`${styles.status} ${status === 'failed' ? styles.failed : ''}`}>
                     {status === 'sending' && <Clock size={12} />}
                     {status === 'sent' && <Check size={12} />}
                     {status === 'delivered' && <CheckCheck size={12} />}
                     {status === 'failed' && <span className={styles.retryBtn}>Retry</span>}
                  </span>
                )}
              </div>
          </>
      )}
    </div>
  );
};
