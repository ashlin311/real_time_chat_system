import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { stompClient } from '../api/stompClient';
import { restClient } from '../api/restClient';
import { useSettingsStore } from '../../store/settingsStore';

const playSonarPing = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
        // Audio API blocked by browser interaction policy
    }
};

export const useRealtimeSync = () => {
    const token = useAuthStore(s => s.token);
    const status = useChatStore(s => s.status);
    const setStatus = useChatStore(s => s.setStatus);
    
    const joinedRooms = useUIStore(s => s.joinedRooms);
    const addMessage = useChatStore(s => s.addMessage);
    const addParticipant = useChatStore(s => s.addParticipant);
    const removeParticipant = useChatStore(s => s.removeParticipant);
    const setRoomMeta = useChatStore(s => s.setRoomMeta);
    const cacheName = useChatStore(s => s.cacheName);
    const joinedRoomsPings = React.useRef<Set<string>>(new Set());

    // Reconcile overall connection
    useEffect(() => {
        if (token) {
            setStatus('CONNECTING');
            stompClient.connect(token, 
                () => setStatus('CONNECTED'),
                () => setStatus('ERROR')
            );
        } else {
            stompClient.disconnect();
            setStatus('DISCONNECTED');
        }

        return () => {
            stompClient.disconnect();
        }
    }, [token, setStatus]);

    // Instant leave beacon on tab/browser close
    useEffect(() => {
        const handleUnload = () => {
            const currentToken = useAuthStore.getState().token;
            const rooms = useUIStore.getState().joinedRooms;
            if (!currentToken || rooms.length === 0) return;
            rooms.forEach(roomId => {
                navigator.sendBeacon(
                    `/api/chat/rooms/${roomId}/leave`,
                    new Blob([JSON.stringify({ token: currentToken })], { type: 'application/json' })
                );
            });
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    // Reconcile room subscriptions
    useEffect(() => {
        if (status === 'CONNECTED') {
            joinedRooms.forEach(roomId => {
                // Sync current snapshot immediately upon entering
                restClient.getRoomMeta(token!, roomId)
                  .then((meta: any) => setRoomMeta(roomId, meta.ownerId, meta.participants, meta.name, meta.isPublic))
                  .catch((e: any) => console.error("Could not fetch room meta: ", e));

                stompClient.subscribeToRoom(roomId, (msg: any) => {
                    const sId = msg.senderId || 'unknown';
                    const sName = msg.senderName || 'Anonymous';
                    cacheName(sId, sName);

                    // Update participant list based on message type
                    const isLeave = msg.contentType === 'SYSTEM' && msg.content === 'left the channel';
                    if (isLeave) {
                        removeParticipant(roomId, sId);
                    } else {
                        addParticipant(roomId, sId);
                    }

                    addMessage({
                        roomId: msg.roomId || roomId,
                        content: msg.content,
                        contentType: msg.contentType || 'TEXT',
                        fileName: msg.fileName,
                        senderId: sId,
                        senderName: sName,
                        timestamp: msg.timestamp || Date.now()
                    });

                    // Ghost Environment Effects
                    const userId = useAuthStore.getState().userId;
                    if (sId !== userId) {
                        const { audioEnabled, notificationsEnabled, mutedRooms } = useSettingsStore.getState();
                        const isRoomMuted = mutedRooms.includes(roomId);
                        
                        if (!isRoomMuted) {
                            if (audioEnabled) {
                                playSonarPing();
                            }

                            if (notificationsEnabled && document.hidden) {
                                new Notification("Cipher Slate", {
                                    body: msg.contentType === 'SYSTEM' ? msg.content : "New encrypted transmission.",
                                    icon: "/favicon.ico"
                                });
                            }
                        }
                    }
                });
                
                // Broadcast connection ping once per room per session
                if (!joinedRoomsPings.current.has(roomId)) {
                    const displayName = useAuthStore.getState().displayName || 'Anonymous';
                    stompClient.sendMessage(token!, roomId, 'joined the room', 'SYSTEM', undefined, displayName);
                    joinedRoomsPings.current.add(roomId);
                }
            });
        }
    }, [joinedRooms, status, addMessage, addParticipant, token]);
};
