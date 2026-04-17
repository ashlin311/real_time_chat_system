package com.chatapp.websocket.handshake;

import com.chatapp.auth.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Validates the JWT during the HTTP → WebSocket upgrade handshake.
 *
 * If validation passes, userId and tokenExpiry are stored in the
 * WebSocket session attributes so all downstream components can
 * access them without re-parsing the token on every frame.
 *
 * Token sources (in priority order):
 *   1. Authorization: Bearer <token>  header  (preferred — not in server logs)
 *   2. ?token=<token>  query parameter         (SockJS browser fallback only — use short-lived tokens)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {

        String token = extractFromHeader(request);
        if (token == null) token = extractFromQuery(request);

        if (token == null) {
            log.warn("WS handshake rejected — no token provided. URI: {}", request.getURI());
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            Claims claims = jwtService.validateAndExtract(token);
            attributes.put("userId",      claims.getSubject());
            attributes.put("tokenExpiry", claims.getExpiration());
            log.debug("WS handshake accepted for userId={}", claims.getSubject());
            return true;
        } catch (JwtException e) {
            log.warn("WS handshake rejected — {}: {}", e.getClass().getSimpleName(), e.getMessage());
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {}

    private String extractFromHeader(ServerHttpRequest request) {
        List<String> authHeaders = request.getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String value = authHeaders.get(0);
            if (value.startsWith("Bearer ")) return value.substring(7);
        }
        return null;
    }

    private String extractFromQuery(ServerHttpRequest request) {
        String query = request.getURI().getQuery();
        if (query == null) return null;
        return Arrays.stream(query.split("&"))
                     .filter(p -> p.startsWith("token="))
                     .map(p -> p.substring(6))
                     .findFirst()
                     .orElse(null);
    }
}
