package com.infosys.fbp.platform.actioncode.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.client.AutoConfigureMockRestServiceServer;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureMockRestServiceServer // Enable mocking of RestTemplate calls
public class ActionCodeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RestTemplate restTemplate; // Inject the RestTemplate bean

    @Autowired
    private MockRestServiceServer mockServer; // Inject the mock server

    @Autowired
    private ObjectMapper objectMapper; // For comparing JSON

    @Value("${manifest.base.url}")
    private String manifestBaseUrl;

    @Value("${manifest.api-list.context-path}")
    private String manifestContextPath;

    private String apiListContent;
    private String createDemandCodeContent;
    private String expectedActionCodeListContent;

    @BeforeEach
    void setUp() throws Exception {
        // Load test resources
        apiListContent = loadResourceContent("apiList.json");
        createDemandCodeContent = loadResourceContent("create-demandCode.json");
        expectedActionCodeListContent = loadResourceContent("ActionCodeList.json");

        // Reset the mock server before each test
        mockServer.reset();

        // Define mock responses for external HTTP calls
        String manifestUrl = manifestBaseUrl + manifestContextPath;
        String schemaUrl = manifestBaseUrl + "docs/create-demandCode.json"; // Path from apiList.json

        mockServer.expect(requestTo(manifestUrl))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(apiListContent, MediaType.APPLICATION_JSON));

        mockServer.expect(requestTo(schemaUrl))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(createDemandCodeContent, MediaType.APPLICATION_JSON));
    }

    @Test
    void testGetActionCodes() throws Exception {
        // Perform GET request to the controller endpoint
        mockMvc.perform(get("/api/actions") // Corrected endpoint path
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json(expectedActionCodeListContent)); // Compare with expected JSON

        // Verify that the mocked HTTP requests were actually made
        mockServer.verify();
    }

    // Helper method to load content from classpath resources
    private String loadResourceContent(String resourcePath) throws Exception {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
    }
}
