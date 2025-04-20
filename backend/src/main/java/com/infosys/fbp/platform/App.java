package com.infosys.fbp.platform;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class App {

    // Inject the allowed origins property from application.properties
    // Provide a default value in case the property is not set
    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Allow requests from configured origins
                registry.addMapping("/api/**") // Apply CORS to API endpoints
                        .allowedOrigins(allowedOrigins) // Use configured origins
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Allowed methods
                        .allowedHeaders("*") // Allow all headers
                        .allowCredentials(true); // Allow credentials (cookies, auth headers)
            }
        };
    }
}
