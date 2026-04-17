package com.chatapp;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class RealTimeChatApplication {

    public static void main(String[] args) {
        // Enforce UTC timezone for backend — must run BEFORE Hibernate & HikariCP initialize
        // Standard best practice for all distributed/cloud backend apps
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        
        SpringApplication.run(RealTimeChatApplication.class, args);
    }
}

