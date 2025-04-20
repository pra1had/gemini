package com.infosys.fbp.platform.health.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

/**
 * Controller for basic health check endpoint.
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    /**
     * Simple health check endpoint.
     * @return A map indicating the service status is "UP".
     */
    @GetMapping
    public ResponseEntity<Map<String, String>> checkHealth() {
        // Return a simple JSON object: {"status": "UP"}
        Map<String, String> response = Collections.singletonMap("status", "UP");
        return ResponseEntity.ok(response);
    }
}
