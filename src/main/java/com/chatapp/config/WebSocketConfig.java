package com.chatapp.config;

import com.chatapp.websocket.handshake.JwtHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;
import org.springframework.context.annotation.Bean;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthChannelInterceptor authChannelInterceptor;
    private final RateLimitingChannelInterceptor rateLimitingChannelInterceptor;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private org.springframework.scheduling.TaskScheduler taskScheduler;

    @Value("${app.websocket.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory simple broker — cross-instance fan-out handled by Redis Streams, NOT a broker relay
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10_000, 10_000}) // 10s heartbeat both directions
                .setTaskScheduler(taskScheduler);
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.split(","));
    }

    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(20 * 1024 * 1024);       // 20 MB max inbound message
        registration.setSendBufferSizeLimit(20 * 1024 * 1024);    // 20 MB send buffer per session
        registration.setSendTimeLimit(20_000);                    // close slow clients after 20s
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.taskExecutor()
                    .corePoolSize(8)
                    .maxPoolSize(32)
                    .keepAliveSeconds(60);
        // Order matters: auth first, then rate limiting
        registration.interceptors(authChannelInterceptor, rateLimitingChannelInterceptor);
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.taskExecutor()
                    .corePoolSize(8)
                    .maxPoolSize(32);
    }
    
    @Override
    public boolean configureMessageConverters(java.util.List<org.springframework.messaging.converter.MessageConverter> messageConverters) {
        org.springframework.messaging.converter.MappingJackson2MessageConverter converter = new org.springframework.messaging.converter.MappingJackson2MessageConverter();
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.getFactory().setStreamReadConstraints(
            com.fasterxml.jackson.core.StreamReadConstraints.builder().maxStringLength(50_000_000).build()
        );
        converter.setObjectMapper(mapper);
        messageConverters.add(converter);
        return false; 
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(50 * 1024 * 1024); // 50MB frames
        container.setMaxBinaryMessageBufferSize(50 * 1024 * 1024);
        return container;
    }
}
