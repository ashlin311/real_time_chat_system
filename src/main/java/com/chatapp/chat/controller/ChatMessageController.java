package com.chatapp.chat.controller;

import com.chatapp.auth.JwtService;
import com.chatapp.chat.dto.SendMessageRequest;
import com.chatapp.chat.service.ChatService;
import com.chatapp.chat.service.StompSessionRegistry;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatMessageController {

    private final ChatService chatService;
    private final JwtService  jwtService;
    private final StompSessionRegistry sessionRegistry;

    /**
     * Client STOMP SEND → /app/chat/{roomId}/send
     * Broadcast goes to  → /topic/chat/{roomId}   (via Redis Streams → StreamConsumer)
     *
     * No @SendTo here — we do NOT broadcast directly from this controller.
     * The StreamConsumer picks up the message from Redis and calls
     * simpMessagingTemplate.convertAndSend() so ALL instances can deliver to their subscribers.
     */
    @MessageMapping("/chat/{roomId}/send")
    public void sendMessage(@DestinationVariable String roomId,
                            @Payload @Valid SendMessageRequest request,
                            SimpMessageHeaderAccessor headerAccessor) {

        Map<String, Object> attrs = headerAccessor.getSessionAttributes();
        if (attrs == null) throw new AccessDeniedException("No session attributes");

        String userId = (String) attrs.get("userId");
        if (userId == null) throw new AccessDeniedException("Not authenticated");

        // requiresRauth flag set by AuthChannelInterceptor when token is near expiry
        if (Boolean.TRUE.equals(attrs.get("requiresRauth"))) {
            throw new IllegalStateException("Token refresh required — send to /app/auth/refresh first");
        }

        // Cache the display name in the session registry for disconnect events
        String sessionId = headerAccessor.getSessionId();
        if (sessionId != null && request.getSenderName() != null) {
            sessionRegistry.registerName(sessionId, request.getSenderName());
        }

        chatService.processMessage(roomId, userId, request);
    }

    /**
     * Client sends a refreshed JWT over the open WebSocket connection.
     * STOMP SEND → /app/auth/refresh   payload: { "token": "<new-access-token>" }
     *
     * On success, session attributes are updated so subsequent SEND frames pass auth.
     */
    @MessageMapping("/auth/refresh")
    public void refreshToken(@Payload Map<String, String> payload,
                             SimpMessageHeaderAccessor headerAccessor) {

        String newToken = payload.get("token");
        if (newToken == null || newToken.isBlank()) {
            throw new IllegalArgumentException("Missing 'token' field in payload");
        }

        Map<String, Object> attrs = headerAccessor.getSessionAttributes();
        if (attrs == null) return;

        try {
            Claims claims = jwtService.validateAndExtract(newToken);
            attrs.put("userId",       claims.getSubject());
            attrs.put("tokenExpiry",  claims.getExpiration());
            attrs.remove("requiresRauth");
            log.debug("Session {} token refreshed — userId={}", headerAccessor.getSessionId(), claims.getSubject());
        } catch (JwtException e) {
            log.warn("In-session token refresh failed: {}", e.getMessage());
            throw new AccessDeniedException("Invalid token provided for refresh");
        }
    }
}
