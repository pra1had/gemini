package com.infosys.fbp.platform;

import org.springframework.boot.web.client.RestTemplateBuilder; // Add import
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration; // Add import for Duration

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5)) // Set connection timeout to 5 seconds
                .setReadTimeout(Duration.ofSeconds(30))   // Set read timeout to 30 seconds
                .build();
    }
}
