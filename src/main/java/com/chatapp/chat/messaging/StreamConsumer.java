package com.chatapp.chat.messaging;

import com.chatapp.chat.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Receives messages from Redis Streams (via XREADGROUP) and broadcasts
 * to WebSocket clients locally connected to THIS ECS task.
 *
 * Consumer group semantics guarantee that each message is delivered to
 * exactly ONE consumer instance. That instance broadcasts to its local
 * WebSocket subscribers via the in-memory SimpleBroker.
 *
 * On success: XACK removes the message from the Pending Entry List (PEL).
 * On failure: no ACK — StreamSubscriptionManager re-claims after idle threshold.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StreamConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    @Override
    public void onMessage(MapRecord<String, String, String> record) {
        String streamKey = record.getStream();
        String roomId    = streamKey.replace(StreamPublisher.STREAM_PREFIX, "");
        Map<String, String> f = record.getValue();

        try {
            ChatMessageDTO dto = ChatMessageDTO.builder()
                    .id(f.get("id"))
                    .roomId(roomId)
                    .senderId(f.get("senderId"))
                    .senderName(f.get("senderName"))
                    .content(f.get("content"))
                    .contentType(f.get("contentType"))
                    .fileName(f.get("fileName"))
                    .createdAt(f.get("createdAt"))
                    .sequenceNum(parseSeqNum(f.get("sequenceNum")))
                    .build();

            // Broadcast to all local WebSocket sessions subscribed to /topic/chat/{roomId}
            messagingTemplate.convertAndSend("/topic/chat/" + roomId, dto);

            // ACK — removes from PEL, message is fully handled
            redisTemplate.opsForStream().acknowledge("chat-consumers", record);

            log.debug("Delivered msgId={} to /topic/chat/{}", f.get("id"), roomId);

        } catch (Exception e) {
            // Do NOT ACK — message stays in PEL for re-delivery by StreamSubscriptionManager
            log.error("Failed to deliver stream record {} for room {} — will redeliver: {}",
                    record.getId(), roomId, e.getMessage());
        }
    }

    private Long parseSeqNum(String value) {
        if (value == null || value.isBlank()) return null;
        try { return Long.parseLong(value); }
        catch (NumberFormatException e) { return null; }
    }
}
