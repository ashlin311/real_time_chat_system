package com.chatapp.chat.service;

import com.chatapp.chat.dto.RoomSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Slf4j
public class RedisRoomRepository {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String ROOM_KEY_PREFIX = "room:";
    private static final String MEMBERS_SUFFIX = ":members";
    private static final String PUBLIC_ROOMS_INDEX = "rooms:public";
    private static final String OWNER_KEY_PREFIX = "room:owner:";

    public void createRoom(String roomId, String roomName, String ownerId, boolean isPublic) {
        String key = ROOM_KEY_PREFIX + roomId;
        String now = Instant.now().toString();

        Map<String, String> meta = Map.of(
                "roomId", roomId,
                "name", roomName != null ? roomName : "",
                "ownerId", ownerId,
                "isPublic", String.valueOf(isPublic),
                "createdAt", now,
                "lastActivity", now
        );

        redisTemplate.opsForHash().putAll(key, meta);
        addParticipant(roomId, ownerId);
        addRoomOwnership(ownerId, roomId);

        if (isPublic) {
            redisTemplate.opsForSet().add(PUBLIC_ROOMS_INDEX, roomId);
        }
        log.info("Redis: Created room {} (public={}, owner={})", roomId, isPublic, ownerId);
    }

    public void addRoomOwnership(String userId, String roomId) {
        String key = OWNER_KEY_PREFIX + userId;
        redisTemplate.opsForSet().add(key, roomId);
    }

    public void removeRoomOwnership(String userId, String roomId) {
        String key = OWNER_KEY_PREFIX + userId;
        redisTemplate.opsForSet().remove(key, roomId);
    }

    public long getOwnedRoomCount(String userId) {
        String key = OWNER_KEY_PREFIX + userId;
        Long count = redisTemplate.opsForSet().size(key);
        return count != null ? count : 0;
    }

    public boolean roomExists(String roomId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(ROOM_KEY_PREFIX + roomId));
    }

    public Optional<RoomSession> getRoom(String roomId) {
        String key = ROOM_KEY_PREFIX + roomId;
        Map<Object, Object> meta = redisTemplate.opsForHash().entries(key);
        if (meta.isEmpty()) return Optional.empty();

        RoomSession session = new RoomSession();
        session.setRoomId((String) meta.get("roomId"));
        session.setRoomName((String) meta.get("name"));
        session.setOwnerId((String) meta.get("ownerId"));
        session.setPublic(Boolean.parseBoolean((String) meta.get("isPublic")));

        Set<String> members = redisTemplate.opsForSet().members(key + MEMBERS_SUFFIX);
        if (members != null) {
            session.getParticipants().addAll(members);
        }

        return Optional.of(session);
    }

    public void addParticipant(String roomId, String userId) {
        String key = ROOM_KEY_PREFIX + roomId + MEMBERS_SUFFIX;
        redisTemplate.opsForSet().add(key, userId);
        touchActivity(roomId);
    }

    public boolean isParticipant(String roomId, String userId) {
        String key = ROOM_KEY_PREFIX + roomId + MEMBERS_SUFFIX;
        return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, userId));
    }

    public void removeParticipant(String roomId, String userId) {
        String key = ROOM_KEY_PREFIX + roomId + MEMBERS_SUFFIX;
        redisTemplate.opsForSet().remove(key, userId);
        touchActivity(roomId);
    }

    public long getParticipantCount(String roomId) {
        String key = ROOM_KEY_PREFIX + roomId + MEMBERS_SUFFIX;
        Long count = redisTemplate.opsForSet().size(key);
        return count != null ? count : 0;
    }

    public void touchActivity(String roomId) {
        String key = ROOM_KEY_PREFIX + roomId;
        redisTemplate.opsForHash().put(key, "lastActivity", Instant.now().toString());
    }

    public Instant getLastActivity(String roomId) {
        String key = ROOM_KEY_PREFIX + roomId;
        String val = (String) redisTemplate.opsForHash().get(key, "lastActivity");
        return val != null ? Instant.parse(val) : Instant.EPOCH;
    }

    public List<String> getPublicRoomIds() {
        Set<String> ids = redisTemplate.opsForSet().members(PUBLIC_ROOMS_INDEX);
        return ids != null ? List.copyOf(ids) : Collections.emptyList();
    }

    public void deleteRoom(String roomId) {
        String key = ROOM_KEY_PREFIX + roomId;
        String ownerId = (String) redisTemplate.opsForHash().get(key, "ownerId");
        
        if (ownerId != null) {
            removeRoomOwnership(ownerId, roomId);
        }

        redisTemplate.delete(key);
        redisTemplate.delete(key + MEMBERS_SUFFIX);
        redisTemplate.opsForSet().remove(PUBLIC_ROOMS_INDEX, roomId);
        log.info("Redis: Deleted room {}", roomId);
    }

    public Set<String> getAllRoomIds() {
        // SCAN approach for production, but for simplicity here we assume room pattern
        // In a real high-traffic app, we'd use a separate set 'active_rooms' to avoid keys *
        Set<String> keys = redisTemplate.keys(ROOM_KEY_PREFIX + "*");
        if (keys == null) return Collections.emptySet();
        return keys.stream()
                .filter(k -> !k.endsWith(MEMBERS_SUFFIX))
                .map(k -> k.substring(ROOM_KEY_PREFIX.length()))
                .collect(Collectors.toSet());
    }
}
