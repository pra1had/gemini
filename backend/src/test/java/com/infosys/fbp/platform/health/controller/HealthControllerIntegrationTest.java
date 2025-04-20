package com.infosys.fbp.platform.health.controller;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

/**
 * Integration tests for the HealthController.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class HealthControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
    }

    @Test
    public void testHealthEndpointReturnsOkAndUpStatus() {
        given()
            .when()
                .get("/health")
            .then()
                .statusCode(HttpStatus.OK.value()) // Check for 200 OK status
                .body("status", equalTo("UP")); // Check if the body contains "status": "UP"
    }
}
