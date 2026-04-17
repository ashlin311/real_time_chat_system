package com.chatapp.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtService jwtService;

    @PostMapping("/ghost")
    public ResponseEntity<?> initializeGhostSession() {
        String temporaryUserId = UUID.randomUUID().toString();
        
        String accessToken = jwtService.generateAccessToken(
                temporaryUserId, Map.of("roles", List.of("ROLE_GHOST")));

        return ResponseEntity.ok(Map.of(
                "accessToken",  accessToken,
                "userId",       temporaryUserId
        ));
    }
}
