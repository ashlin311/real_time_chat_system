import React, { createContext, useContext, useEffect, useState } from 'react';

type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

interface WebSocketContextProps {
  connectionState: ConnectionState;
  sendMessage: (destination: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextProps | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');

  useEffect(() => {
    setConnectionState('CONNECTING');
    const timer = setTimeout(() => {
      setConnectionState('CONNECTED');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = (destination: string, payload: any) => {
    console.log(`[WS Skeleton] Sending to ${destination}`, payload);
  };

  return (
    <WebSocketContext.Provider value={{ connectionState, sendMessage }}>
      {connectionState !== 'CONNECTED' && connectionState !== 'DISCONNECTED' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          backgroundColor: 'var(--error-container)', color: 'white',
          padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold'
        }}>
          {connectionState === 'CONNECTING' ? 'Connecting to Node...' : 'Reconnecting...'}
        </div>
      )}
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
};
