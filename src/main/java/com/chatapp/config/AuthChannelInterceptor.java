package com.chatapp.config;

import com.chatapp.auth.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;

/**
 * Intercepts every inbound STOMP frame.

 * On CONNECT  — validates JWT (defense-in-depth alongside handshake interceptor).
 * On SEND     — checks token near-expiry and sets requiresRauth flag.
 * On SUBSCRIBE — ensures session is authenticated.

 * Does NOT close the socket on expiry — challenges the client to refresh first.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private static final long RAUTH_THRESHOLD_MS = 60_000; // challenge 60s before expiry

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor
                .getAccessor(message, StompHeaderAccessor.class);
        if (acc == null) return message;

        StompCommand command = acc.getCommand();
        if (command == null) return message;

        switch (command) {
            case CONNECT    -> handleConnect(acc);
            case SEND       -> { ensureAuthenticated(acc); checkExpiry(acc); }
            case SUBSCRIBE  -> ensureAuthenticated(acc);
            default         -> { /* DISCONNECT, ACK, NACK — no-op */ }
        }
        return message;
    }

    private void handleConnect(StompHeaderAccessor acc) {
        Map<String, Object> attrs = acc.getSessionAttributes();
        // If handshake interceptor already set userId, skip re-validation
        if (attrs != null && attrs.get("userId") != null) return;

        String raw = acc.getFirstNativeHeader("Authorization");
        if (raw != null && raw.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.validateAndExtract(raw.substring(7));
                if (attrs != null) {
                    attrs.put("userId", claims.getSubject());
                    attrs.put("tokenExpiry", claims.getExpiration());
                }
            } catch (JwtException e) {
                log.warn("STOMP CONNECT rejected — invalid JWT: {}", e.getMessage());
                throw new AccessDeniedException("Invalid token");
            }
        }
    }

    private void ensureAuthenticated(StompHeaderAccessor acc) {
        Map<String, Object> attrs = acc.getSessionAttributes();
        if (attrs == null || attrs.get("userId") == null) {
            log.warn("Unauthenticated STOMP frame rejected — session: {}", acc.getSessionId());
            throw new AccessDeniedException("Not authenticated");
        }
    }

    private void checkExpiry(StompHeaderAccessor acc) {
        Map<String, Object> attrs = acc.getSessionAttributes();
        if (attrs == null) return;
        Date expiry = (Date) attrs.get("tokenExpiry");
        if (expiry != null) {
            long remaining = expiry.getTime() - System.currentTimeMillis();
            if (remaining < RAUTH_THRESHOLD_MS) {
                attrs.put("requiresRauth", true);
                log.debug("Session {} token expires in {}ms — re-auth flag set",
                        acc.getSessionId(), remaining);
            }
        }
    }
}
