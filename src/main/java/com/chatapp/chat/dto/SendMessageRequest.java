package com.chatapp.chat.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class SendMessageRequest {
    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 2000, message = "Message exceeds maximum length (2000 characters)")
    private String content;
    private String contentType = "TEXT";
    private String fileName;
    private String senderName;
}
