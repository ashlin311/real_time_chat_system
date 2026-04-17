package com.chatapp.chat.dto;

import lombok.*;

/**
 * Outbound DTO sent to WebSocket subscribers on /topic/chat/{roomId}.
 * Also returned from the REST history endpoints.
 *
 * Kept as a flat structure — no nested objects — so Jackson serializes it
 * efficiently and the Redis Stream field map stays simple strings.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageDTO {
    private String id;
    private String roomId;
    private String senderId;
    private String senderName;
    private String content;
    private String contentType;
    private String fileName;
    private String createdAt;
    private Long   sequenceNum;
}
