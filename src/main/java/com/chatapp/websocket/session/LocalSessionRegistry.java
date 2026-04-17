package com.chatapp.websocket.session;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-process registry of active WebSocket sessions on this ECS task.
 *
 * Used for:
 *   - Exposing active connection count as a custom CloudWatch metric (auto-scaling trigger)
 *   - Debug / diagnostics
 *
 * NOT used for message routing — Spring's SimpleBroker handles local delivery.
 * Cross-instance delivery is handled by Redis Streams.
 */
@Component
@Slf4j
public class LocalSessionRegistry {

    private final ConcurrentHashMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    private final AtomicLong activeCount = new AtomicLong(0);

    public void register(String sessionId, String userId) {
        sessionToUser.put(sessionId, userId);
        long total = activeCount.incrementAndGet();
        log.debug("WS session registered: {} (userId={}) — total: {}", sessionId, userId, total);
    }

    public void deregister(String sessionId) {
        String userId = sessionToUser.remove(sessionId);
        if (userId != null) {
            long total = activeCount.decrementAndGet();
            log.debug("WS session deregistered: {} (userId={}) — total: {}", sessionId, userId, total);
        }
    }

    public long getActiveCount()                        { return activeCount.get(); }
    public String getUserId(String sessionId)           { return sessionToUser.get(sessionId); }
    public Set<String> getActiveSessions()              { return Collections.unmodifiableSet(sessionToUser.keySet()); }
}
