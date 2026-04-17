package com.chatapp.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks which STOMP sessionId maps to which userId,
 * and which rooms each session has subscribed to.
 * Used by PresenceEventListener to clean up on disconnect.
 */
@Component
@Slf4j
public class StompSessionRegistry {

    // sessionId -> userId
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    // sessionId -> displayName
    private final Map<String, String> sessionNameMap = new ConcurrentHashMap<>();

    // sessionId -> Set<roomId>
    private final Map<String, Set<String>> sessionRoomMap = new ConcurrentHashMap<>();

    public void registerUser(String sessionId, String userId) {
        sessionUserMap.put(sessionId, userId);
        log.debug("Registered session {} -> user {}", sessionId, userId);
    }

    public void registerName(String sessionId, String name) {
        sessionNameMap.put(sessionId, name);
        log.debug("Registered session {} -> name {}", sessionId, name);
    }

    public void registerSubscription(String sessionId, String roomId) {
        sessionRoomMap.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet()).add(roomId);
        log.debug("Session {} subscribed to room {}", sessionId, roomId);
    }

    public String getUserId(String sessionId) {
        return sessionUserMap.get(sessionId);
    }

    public String getName(String sessionId) {
        return sessionNameMap.getOrDefault(sessionId, "Anonymous");
    }

    public Set<String> getRooms(String sessionId) {
        return sessionRoomMap.getOrDefault(sessionId, Set.of());
    }

    public void removeSession(String sessionId) {
        sessionUserMap.remove(sessionId);
        sessionNameMap.remove(sessionId);
        sessionRoomMap.remove(sessionId);
        log.debug("Cleaned up session {}", sessionId);
    }
}
