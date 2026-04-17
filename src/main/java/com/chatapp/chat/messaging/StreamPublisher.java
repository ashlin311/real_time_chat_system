package com.chatapp.chat.messaging;

import com.chatapp.chat.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class StreamPublisher {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.redis.stream.max-len:10000}")
    private long maxLen;

    public static final String STREAM_PREFIX = "chat:room:";

    public RecordId publish(String roomId, ChatMessageDTO message) {
        String streamKey = STREAM_PREFIX + roomId;

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("id",          message.getId());
        fields.put("roomId",      roomId);
        fields.put("senderId",    message.getSenderId());
        fields.put("senderName",  message.getSenderName() != null ? message.getSenderName() : "Anonymous");
        fields.put("content",     message.getContent());
        fields.put("contentType", message.getContentType());
        fields.put("fileName",    message.getFileName() != null ? message.getFileName() : "");
        fields.put("createdAt",   message.getCreatedAt());

        RecordId recordId = redisTemplate.opsForStream()
                .add(StreamRecords.newRecord().in(streamKey).ofMap(fields));

        redisTemplate.opsForStream().trim(streamKey, maxLen, true);

        return recordId;
    }
}
