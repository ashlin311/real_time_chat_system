package com.chatapp.chat.controller;

import com.chatapp.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import com.chatapp.chat.dto.RoomSession;
import java.security.Principal;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(Principal principal, @RequestBody Map<String, String> payload) {
        try {
            String userId = principal.getName();
            String roomName = payload.getOrDefault("name", "Ghost Node");
            String type = payload.getOrDefault("type", "private");

            String roomId = chatService.createRoom(userId, roomName, type);
            return ResponseEntity.ok(Map.of("id", roomId, "name", roomName, "ownerId", userId, "isPublic", "public".equalsIgnoreCase(type)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized or invalid session"));
        }
    }

    @GetMapping("/rooms/public")
    public ResponseEntity<?> getPublicRooms() {
        return ResponseEntity.ok(chatService.getPublicRooms());
    }

    @PostMapping("/rooms/{roomId}/join")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId, Principal principal) {
        try {
            String userId = principal.getName();
            chatService.joinRoom(roomId, userId);
            RoomSession session = chatService.getRoomSession(roomId);
            return ResponseEntity.ok(Map.of("status", "joined", "roomId", roomId, "name", session.getRoomName() != null ? session.getRoomName() : roomId, "isPublic", session.isPublic()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized or invalid session"));
        }
    }

    @PostMapping("/rooms/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable String roomId, Principal principal) {
        try {
            String userId = principal.getName();
            chatService.removeParticipant(roomId, userId);
            return ResponseEntity.ok(Map.of("status", "left"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("status", "ignored")); // non-fatal
        }
    }
    
    @GetMapping("/rooms/{roomId}/meta")
    public ResponseEntity<?> getRoomMeta(@PathVariable String roomId) {
        try {
            RoomSession session = chatService.getRoomSession(roomId);
            return ResponseEntity.ok(session);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Room not found"));
        }
    }
}
