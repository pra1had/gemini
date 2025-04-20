package com.infosys.fbp.platform.actioncode.service;

// import com.fasterxml.jackson.core.type.TypeReference; // Keep for expected result loading
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.fbp.platform.actioncode.dto.ActionCodeInfo;
// import org.junit.jupiter.api.BeforeEach; // Remove
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith; // Add
import org.springframework.beans.factory.annotation.Autowired; // Add
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest; // Add
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod; // Add
import org.springframework.http.HttpStatus; // Add
import org.springframework.http.MediaType; // Add
import org.springframework.context.annotation.Import; // Add
import org.springframework.test.context.TestPropertySource; // Add
import org.springframework.test.context.junit.jupiter.SpringExtension; // Add
import org.springframework.test.web.client.ExpectedCount; // Add
import org.springframework.test.web.client.MockRestServiceServer; // Add
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*; // Add static imports
import static org.springframework.test.web.client.response.MockRestResponseCreators.*; // Add static imports
// import com.infosys.fbp.platform.AppConfig; // Remove import for AppConfig
import com.infosys.fbp.platform.RestClientConfig; // Add import for RestClientConfig

import java.io.InputStream;
import java.util.List;

import java.io.InputStream;
import java.nio.charset.StandardCharsets; // Add
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@RestClientTest(ActionCodeService.class)
@Import(RestClientConfig.class) // Import RestClientConfig instead of AppConfig
// Define the new base URL and context path properties for the test
@TestPropertySource(properties = {
        "manifest.base.url=http://test-url.com/", // Base URL for test
        "manifest.api-list.context-path=apiList.json" // Context path for test
})
class ActionCodeServiceTest {

    @Autowired
    private ActionCodeService actionCodeService; // Autowire the service under test

    @Autowired
    private ObjectMapper objectMapper; // Autowire ObjectMapper (provided by @RestClientTest)

    @Autowired
    private MockRestServiceServer mockServer; // Autowire MockRestServiceServer (provided by @RestClientTest)

    // @BeforeEach // Remove setUp method
    // void setUp() { ... }

    @Test
    void testGenerateActionCodeList() throws Exception {
        // 1. Load the mock JSON response for the apiList.json endpoint
        String mockApiListJsonContent;
        ClassPathResource apiListResource = new ClassPathResource("apiList.json"); // Load the mock manifest
        try (InputStream inputStream = apiListResource.getInputStream()) {
            mockApiListJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 2. Load the mock JSON response for the create-demandCode.json schema endpoint
        String mockCreateDemandCodeJsonContent;
        ClassPathResource createDemandCodeResource = new ClassPathResource("create-demandCode.json"); // Load the mock schema
        try (InputStream inputStream = createDemandCodeResource.getInputStream()) {
            mockCreateDemandCodeJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 3. Load expected result (ActionCodeInfo list) from ActionCodeList.json
        List<ActionCodeInfo> expectedActionCodeList;
        ClassPathResource expectedResultResource = new ClassPathResource("ActionCodeList.json");
        try (InputStream inputStream = expectedResultResource.getInputStream()) {
            // Use the autowired objectMapper
            expectedActionCodeList = objectMapper.readValue(inputStream, new com.fasterxml.jackson.core.type.TypeReference<List<ActionCodeInfo>>() {});
        }

        // 3. Configure the MockRestServiceServer to expect the call and return the mock response
        // Expect the call to the URL constructed from the test properties
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json")) // Base URL + Context Path
                .andExpect(method(HttpMethod.GET)) // Expect GET method
                .andRespond(withStatus(HttpStatus.OK) // Respond with 200 OK
                        .contentType(MediaType.APPLICATION_JSON) // Set content type
                        .body(mockApiListJsonContent));

        // Configure mock response for the schema file request
        // Expect the call to the schema URL resolved relative to the test base URL
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/docs/create-demandCode.json")) // Base URL + schemaPath from mock apiList.json
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(mockCreateDemandCodeJsonContent)); // Set the mock schema JSON as body

        // 5. Call the service method to get the actual result
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 5. Assert the results
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).hasSize(expectedActionCodeList.size());

        assertThat(actualActionCodeList)
            .usingRecursiveFieldByFieldElementComparator()
            .containsExactlyInAnyOrderElementsOf(expectedActionCodeList);

        // 7. Verify that the mock server received all expected requests
        this.mockServer.verify();
    }

    @Test
    void testGenerateActionCodeList_ManifestFetchError() throws Exception {
        // 1. Configure MockRestServiceServer to return an error for the manifest request
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR)); // Simulate 500 error

        // 2. Call the service method
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 3. Assert that the returned list is empty (or handle specific exception if thrown)
        // Assuming the service logs the error and returns an empty list upon manifest fetch failure
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).isEmpty();

        // 4. Verify the mock server interaction
        this.mockServer.verify();
    }

    @Test
    void testGenerateActionCodeList_SchemaFetchError() throws Exception {
        // 1. Load the mock JSON response for the apiList.json endpoint (successful fetch)
        String mockApiListJsonContent;
        ClassPathResource apiListResource = new ClassPathResource("apiList.json");
        try (InputStream inputStream = apiListResource.getInputStream()) {
            mockApiListJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 2. Configure MockRestServiceServer for successful manifest fetch
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(mockApiListJsonContent));

        // 3. Configure MockRestServiceServer to return an error for the schema request
        // URL derived from mockApiListJsonContent: "docs/create-demandCode.json" relative to base URL
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/docs/create-demandCode.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.NOT_FOUND)); // Simulate 404 error

        // 4. Call the service method
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 5. Assert that the returned list is empty
        // Assuming the service logs the error for the specific schema and skips it,
        // resulting in an empty list if it was the only entry.
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).isEmpty(); // Because the only schema failed to load

        // 6. Verify the mock server interaction
        this.mockServer.verify();
    }

    @Test
    void testGenerateActionCodeList_InvalidManifestJson() throws Exception {
        // 1. Configure MockRestServiceServer to return invalid JSON for the manifest request
        String invalidJson = "this is not json";
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(invalidJson)); // Respond with invalid JSON

        // 2. Call the service method
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 3. Assert that the returned list is empty
        // Assuming the service logs the parsing error and returns an empty list
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).isEmpty();

        // 4. Verify the mock server interaction
        this.mockServer.verify();
    }

    @Test
    void testGenerateActionCodeList_InvalidSchemaJson() throws Exception {
        // 1. Load valid mock manifest
        String mockApiListJsonContent;
        ClassPathResource apiListResource = new ClassPathResource("apiList.json");
        try (InputStream inputStream = apiListResource.getInputStream()) {
            mockApiListJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 2. Configure successful manifest fetch
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(mockApiListJsonContent));

        // 3. Configure schema fetch to return invalid JSON
        String invalidJson = "this is not json";
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/docs/create-demandCode.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(invalidJson)); // Respond with invalid JSON

        // 4. Call the service method
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 5. Assert that the returned list is empty
        // Assuming the service logs the parsing error for the schema and skips it
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).isEmpty();

        // 6. Verify the mock server interaction
        this.mockServer.verify();
    }

     @Test
    void testGenerateActionCodeList_SchemaWithZeroPaths() throws Exception {
        // 1. Load valid mock manifest
        String mockApiListJsonContent;
        ClassPathResource apiListResource = new ClassPathResource("apiList.json");
        try (InputStream inputStream = apiListResource.getInputStream()) {
            mockApiListJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 2. Configure successful manifest fetch
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(mockApiListJsonContent));

        // 3. Create mock schema content with zero paths
        String zeroPathSchema = "{\n" +
                                "  \"openapi\": \"3.0.0\",\n" +
                                "  \"info\": { \"title\": \"Zero Path API\", \"version\": \"1.0.0\" },\n" +
                                "  \"paths\": {}\n" +
                                "}";

        // 4. Configure schema fetch to return the zero-path schema
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/docs/create-demandCode.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(zeroPathSchema));

        // 5. Call the service method
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 6. Assert that the returned list is empty
        // Assuming the service logs a warning and skips schemas with zero paths
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).isEmpty();

        // 7. Verify the mock server interaction
        this.mockServer.verify();
    }

    @Test
    void testGenerateActionCodeList_SchemaWithMultiplePaths() throws Exception {
        // 1. Load valid mock manifest
        String mockApiListJsonContent;
        ClassPathResource apiListResource = new ClassPathResource("apiList.json");
        try (InputStream inputStream = apiListResource.getInputStream()) {
            mockApiListJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 2. Configure successful manifest fetch
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(mockApiListJsonContent));

        // 3. Create mock schema content with multiple paths
        String multiPathSchema = "{\n" +
                                 "  \"openapi\": \"3.0.0\",\n" +
                                 "  \"info\": { \"title\": \"Multi Path API\", \"version\": \"1.0.0\" },\n" +
                                 "  \"paths\": {\n" +
                                 "    \"/path1\": { \"get\": { \"summary\": \"Path 1\", \"responses\": { \"200\": { \"description\": \"OK\" } } } },\n" +
                                 "    \"/path2\": { \"post\": { \"summary\": \"Path 2\", \"responses\": { \"201\": { \"description\": \"Created\" } } } }\n" +
                                 "  }\n" +
                                 "}";

        // 4. Configure schema fetch to return the multi-path schema
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/docs/create-demandCode.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(multiPathSchema));

        // 5. Call the service method
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 6. Assert that the returned list is empty
        // Assuming the service logs a warning and skips schemas with multiple paths
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).isEmpty();

        // 7. Verify the mock server interaction
        this.mockServer.verify();
    }

    @Test
    void testGenerateActionCodeList_ComplexSchemaFlattening() throws Exception {
        // 1. Load the mock manifest for the complex schema test
        String mockApiListJsonContent;
        ClassPathResource apiListResource = new ClassPathResource("apiList_complexSchema.json");
        try (InputStream inputStream = apiListResource.getInputStream()) {
            mockApiListJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 2. Load the mock complex schema JSON
        String mockComplexSchemaJsonContent;
        ClassPathResource complexSchemaResource = new ClassPathResource("complex-schema.json");
        try (InputStream inputStream = complexSchemaResource.getInputStream()) {
            mockComplexSchemaJsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // 3. Load the expected result for the complex schema
        List<ActionCodeInfo> expectedActionCodeList;
        ClassPathResource expectedResultResource = new ClassPathResource("ActionCodeList_complexSchema.json");
        try (InputStream inputStream = expectedResultResource.getInputStream()) {
            expectedActionCodeList = objectMapper.readValue(inputStream, new com.fasterxml.jackson.core.type.TypeReference<List<ActionCodeInfo>>() {});
        }

        // 4. Configure mock server for manifest fetch
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/apiList.json")) // Still uses the property-defined manifest path
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(mockApiListJsonContent)); // Use the complex test manifest

        // 5. Configure mock server for complex schema fetch
        // URL derived from apiList_complexSchema.json: "docs/complex-schema.json" relative to base URL
        this.mockServer.expect(ExpectedCount.once(),
                requestTo("http://test-url.com/docs/complex-schema.json"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.OK)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(mockComplexSchemaJsonContent)); // Use the complex schema content

        // 6. Call the service method
        List<ActionCodeInfo> actualActionCodeList = actionCodeService.generateActionCodeList();

        // 7. Assert the results
        assertThat(actualActionCodeList).isNotNull();
        assertThat(actualActionCodeList).hasSize(expectedActionCodeList.size());

        // Use recursive comparison for nested structures
        assertThat(actualActionCodeList)
            .usingRecursiveFieldByFieldElementComparator()
            .containsExactlyInAnyOrderElementsOf(expectedActionCodeList);

        // 8. Verify mock server interactions
        this.mockServer.verify();
    }
}
