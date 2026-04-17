package com.chatapp.chat.service;

import com.chatapp.chat.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomGarbageCollector {

    private final RedisRoomRepository roomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.room.ttl-minutes:30}")
    private int roomTtlMinutes;

    @Value("${app.room.empty-ttl-minutes:5}")
    private int emptyRoomTtlMinutes;

    /**
     * Runs every 60 seconds (configured via property).
     * Scans for rooms that have exceeded their TTL.
     */
    @Scheduled(fixedRateString = "${app.room.gc-interval-ms:60000}")
    public void cleanupExpiredRooms() {
        Set<String> roomIds = roomRepository.getAllRoomIds();
        if (roomIds.isEmpty()) return;

        Instant now = Instant.now();
        log.debug("GC: Scanning {} rooms for expiry...", roomIds.size());

        for (String roomId : roomIds) {
            try {
                Instant lastActivity = roomRepository.getLastActivity(roomId);
                long participantCount = roomRepository.getParticipantCount(roomId);
                long idleMinutes = Duration.between(lastActivity, now).toMinutes();

                boolean shouldDelete = false;
                String reason = "";

                if (participantCount == 0 && idleMinutes >= emptyRoomTtlMinutes) {
                    shouldDelete = true;
                    reason = "room empty for " + idleMinutes + "m";
                } else if (idleMinutes >= roomTtlMinutes) {
                    shouldDelete = true;
                    reason = "inactivity for " + idleMinutes + "m";
                }

                if (shouldDelete) {
                    log.info("GC: Scaling down room {} — reason: {}", roomId, reason);
                    
                    // Broadcast expiry message if there are still people inside (though unlikely for 30m idle)
                    if (participantCount > 0) {
                        broadcastExpiry(roomId);
                    }
                    
                    roomRepository.deleteRoom(roomId);
                }
            } catch (Exception e) {
                log.error("GC: Error processing room {}: {}", roomId, e.getMessage());
            }
        }
    }

    private void broadcastExpiry(String roomId) {
        ChatMessageDTO expiryMsg = ChatMessageDTO.builder()
                .id(UUID.randomUUID().toString())
                .roomId(roomId)
                .senderId("SYSTEM")
                .senderName("SYSTEM")
                .content("Room has expired due to inactivity and is being decommissioned.")
                .contentType("SYSTEM")
                .createdAt(Instant.now().toString())
                .build();
        
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, expiryMsg);
    }
}
