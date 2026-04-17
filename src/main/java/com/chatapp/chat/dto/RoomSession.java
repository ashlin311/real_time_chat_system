package com.chatapp.chat.dto;

import lombok.Data;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class RoomSession {
    private String roomId;
    private String roomName;
    private boolean isPublic;
    private String ownerId;
    private Set<String> participants = ConcurrentHashMap.newKeySet();
}
