package com.chatapp.websocket.event;

import com.chatapp.websocket.session.LocalSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SessionEventListener {

    private final LocalSessionRegistry sessionRegistry;

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> attrs = acc.getSessionAttributes();
        if (attrs != null) {
            String userId = (String) attrs.get("userId");
            sessionRegistry.register(acc.getSessionId(), userId);
            log.info("User {} connected — sessionId: {}", userId, acc.getSessionId());
        }
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent event) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
        sessionRegistry.deregister(acc.getSessionId());
    }
}
