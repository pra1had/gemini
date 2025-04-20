package com.infosys.fbp.platform;

import org.springframework.boot.web.client.RestTemplateBuilder; // Add import
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) { // Inject RestTemplateBuilder
        return builder.build(); // Build RestTemplate using the builder
    }
}
