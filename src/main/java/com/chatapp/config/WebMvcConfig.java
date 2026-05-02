package com.chatapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Serves the React frontend from Spring Boot's static folder.
 * 
 * When a user refreshes the page or navigates directly to a URL like /rooms/abc,
 * the browser asks the server for that path. Since it's a React route (not a real file),
 * we need to return index.html so React can handle the routing on the client side.
 * 
 * API calls (/api/**) and WebSocket (/ws/**) are NOT affected by this — they still
 * go to their normal Spring controllers.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(@NonNull String resourcePath, @NonNull Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        // If the file exists (JS, CSS, images), serve it directly.
                        // Otherwise, serve index.html so React Router can handle it.
                        return requested.exists() && requested.isReadable()
                                ? requested
                                : new ClassPathResource("/static/index.html");
                    }
                });
    }
}
