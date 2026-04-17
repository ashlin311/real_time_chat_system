package com.chatapp.chat.service;

import com.chatapp.chat.dto.ChatMessageDTO;
import com.chatapp.chat.dto.SendMessageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.Instant;
import java.util.UUID;
import java.util.Set;
import com.chatapp.chat.dto.RoomSession;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    
    @Value("${app.limits.max-rooms-per-user:5}")
    private int maxRoomsPerUser;

    @Value("${app.limits.max-participants-per-room:100}")
    private int maxParticipantsPerRoom;

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisRoomRepository roomRepository;

    public void processMessage(String roomId, String userId, SendMessageRequest req) {
        if (!roomRepository.roomExists(roomId)) {
             log.warn("Message sent to dead room: {}", roomId);
             return;
        }

        roomRepository.touchActivity(roomId);

        ChatMessageDTO msg = ChatMessageDTO.builder()
                .id(UUID.randomUUID().toString())
                .roomId(roomId)
                .senderId(userId)
                .senderName(req.getSenderName() != null ? req.getSenderName() : "Anonymous")
                .content(req.getContent())
                .contentType(req.getContentType())
                .fileName(req.getFileName())
                .createdAt(Instant.now().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, msg);
    }

    public String createRoom(String ownerId, String roomName, String type) {
        String roomId;
        boolean isPublic = "public".equalsIgnoreCase(type);
        
        if (isPublic) {
            roomId = roomName.toLowerCase().replaceAll("[^a-z0-9-]", "-");
        } else {
            roomId = UUID.randomUUID().toString();
        }
        
        if (roomRepository.roomExists(roomId)) {
            return roomId;
        }

        // Enforce room creation limit
        long ownedCount = roomRepository.getOwnedRoomCount(ownerId);
        if (ownedCount >= maxRoomsPerUser) {
            throw new IllegalStateException("Maximum room creation limit reached (" + maxRoomsPerUser + ")");
        }

        roomRepository.createRoom(roomId, roomName, ownerId, isPublic);
        return roomId;
    }

    public void joinRoom(String roomId, String userId) {
        if (!roomRepository.roomExists(roomId)) {
            throw new IllegalArgumentException("Room does not exist or has decayed.");
        }

        // Idempotent join check
        if (roomRepository.isParticipant(roomId, userId)) {
            return;
        }

        // Enforce participant limit
        long participantCount = roomRepository.getParticipantCount(roomId);
        if (participantCount >= maxParticipantsPerRoom) {
            throw new IllegalStateException("Room is full (max " + maxParticipantsPerRoom + " participants)");
        }

        roomRepository.addParticipant(roomId, userId);
    }

    public void removeParticipant(String roomId, String userId, String senderName) {
        if (!roomRepository.roomExists(roomId)) return; 

        roomRepository.removeParticipant(roomId, userId);
        log.info("User {} ({}) removed from room {}", userId, senderName, roomId);

        // Broadcast system leave message
        ChatMessageDTO leaveMsg = ChatMessageDTO.builder()
                .id(UUID.randomUUID().toString())
                .roomId(roomId)
                .senderId(userId)
                .senderName(senderName != null ? senderName : "Anonymous")
                .content("left the channel")
                .contentType("SYSTEM")
                .createdAt(Instant.now().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, leaveMsg);
    }

    // Overload for backward compatibility (REST leave endpoint)
    public void removeParticipant(String roomId, String userId) {
        removeParticipant(roomId, userId, "Anonymous");
    }
    
    public RoomSession getRoomSession(String roomId) {
        return roomRepository.getRoom(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room does not exist or has decayed."));
    }

    public java.util.List<RoomSession> getPublicRooms() {
        return roomRepository.getPublicRoomIds().stream()
            .map(id -> roomRepository.getRoom(id))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(java.util.stream.Collectors.toList());
    }
}
