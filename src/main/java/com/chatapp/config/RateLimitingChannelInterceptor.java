package com.chatapp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Per-user token-bucket rate limiter on inbound SEND frames.
 *
 * Uses a simple token bucket without Guava to avoid an extra dependency.
 * Each user gets `messagesPerSecond` tokens refilled every second.
 */
@Component
@Slf4j
public class RateLimitingChannelInterceptor implements ChannelInterceptor {

    @Value("${app.rate-limit.messages-per-second:10.0}")
    private double messagesPerSecond;

    // userId → TokenBucket
    private final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor
                .getAccessor(message, StompHeaderAccessor.class);
        if (acc == null || !StompCommand.SEND.equals(acc.getCommand())) return message;

        Map<String, Object> attrs = acc.getSessionAttributes();
        if (attrs == null) return message;
        String userId = (String) attrs.get("userId");
        if (userId == null) return message;

        TokenBucket bucket = buckets.computeIfAbsent(userId, k -> new TokenBucket(messagesPerSecond));
        if (!bucket.tryConsume()) {
            log.warn("Rate limit exceeded for user {}", userId);
            throw new MessageDeliveryException("Rate limit exceeded — max " + (int) messagesPerSecond + " messages/sec");
        }
        return message;
    }

    /** Minimal token bucket implementation (no extra dependencies). */
    private static class TokenBucket {
        private final double refillRate;       // tokens per nanosecond
        private final double maxTokens;
        private double tokens;
        private long lastRefillNanos;

        TokenBucket(double messagesPerSecond) {
            this.refillRate     = messagesPerSecond / 1_000_000_000.0;
            this.maxTokens      = messagesPerSecond;
            this.tokens         = messagesPerSecond;
            this.lastRefillNanos = System.nanoTime();
        }

        synchronized boolean tryConsume() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.nanoTime();
            double added = (now - lastRefillNanos) * refillRate;
            tokens = Math.min(maxTokens, tokens + added);
            lastRefillNanos = now;
        }
    }
}
