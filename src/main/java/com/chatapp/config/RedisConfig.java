package com.chatapp.config;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.util.StringUtils;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host}")       private String host;
    @Value("${spring.data.redis.port}")       private int    port;
    @Value("${spring.data.redis.password:}") private String password;
    @Value("${spring.data.redis.ssl.enabled:false}") private boolean sslEnabled;
    @Value("${app.redis.stream.poll-timeout-ms:100}") private long pollMs;
    @Value("${app.redis.stream.batch-size:50}")        private int  batchSize;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(host, port);
        if (StringUtils.hasText(password)) cfg.setPassword(password);

        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder =
            LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(2))
                .clientOptions(ClientOptions.builder()
                    .autoReconnect(true)
                    .socketOptions(SocketOptions.builder()
                        .connectTimeout(Duration.ofSeconds(1))
                        .keepAlive(SocketOptions.KeepAliveOptions.builder()
                            .enable()
                            .idle(Duration.ofSeconds(60))
                            .interval(Duration.ofSeconds(10))
                            .count(3)
                            .build())
                        .build())
                    .build());

        if (sslEnabled) builder.useSsl();

        return new LettuceConnectionFactory(cfg, builder.build());
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate(LettuceConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        StringRedisSerializer serializer = new StringRedisSerializer();
        template.setKeySerializer(serializer);
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(serializer);
        template.setHashValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * StreamMessageListenerContainer — drives the Redis Streams polling loop.
     * Room subscriptions are registered dynamically by StreamSubscriptionManager at runtime.
     */
    @Bean
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>>
            streamListenerContainer(LettuceConnectionFactory factory) {

        var options = StreamMessageListenerContainer
            .StreamMessageListenerContainerOptions
            .<String, MapRecord<String, String, String>>builder()
            .pollTimeout(Duration.ofMillis(pollMs))
            .batchSize(batchSize)
            .serializer(new StringRedisSerializer())
            .build();

        var container = StreamMessageListenerContainer.create(factory, options);
        container.start();
        return container;
    }
}
