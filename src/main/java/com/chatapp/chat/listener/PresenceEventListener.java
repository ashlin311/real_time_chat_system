package com.chatapp.chat.listener;

import com.chatapp.chat.service.ChatService;
import com.chatapp.chat.service.StompSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;
import java.util.Set;

/**
 * Listens to STOMP lifecycle events.
 * Registers sessions on CONNECT and cleans up presence on DISCONNECT.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceEventListener {

    private final StompSessionRegistry registry;
    private final ChatService chatService;

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = acc.getSessionId();
        Map<String, Object> attrs = acc.getSessionAttributes();

        if (sessionId != null && attrs != null) {
            String userId = (String) attrs.get("userId");
            if (userId != null) {
                registry.registerUser(sessionId, userId);
                log.info("PRESENCE: session {} connected as user {}", sessionId, userId);
            }
        }
    }

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = acc.getSessionId();
        String destination = acc.getDestination();

        // Destination looks like /topic/chat/{roomId}
        if (sessionId != null && destination != null && destination.startsWith("/topic/chat/")) {
            String roomId = destination.replace("/topic/chat/", "");
            registry.registerSubscription(sessionId, roomId);
            log.info("PRESENCE: session {} subscribed to room {}", sessionId, roomId);
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = acc.getSessionId();
        if (sessionId == null) return;

        String userId = registry.getUserId(sessionId);
        String displayName = registry.getName(sessionId);
        Set<String> rooms = registry.getRooms(sessionId);

        if (userId != null && !rooms.isEmpty()) {
            for (String roomId : rooms) {
                try {
                    chatService.removeParticipant(roomId, userId, displayName);
                    log.info("PRESENCE: user {} ({}) left room {}", userId, displayName, roomId);
                } catch (Exception e) {
                    log.warn("Could not remove user {} from room {}: {}", userId, roomId, e.getMessage());
                }
            }
        }

        registry.removeSession(sessionId);
    }
}
