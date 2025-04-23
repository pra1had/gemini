package com.infosys.fbp.platform.scenario.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDto;
import com.infosys.fbp.platform.scenario.service.ScenarioPersistenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.hamcrest.beans.HasPropertyWithValue.hasProperty;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ScenarioPersistenceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ScenarioPersistenceService persistenceService;

    @BeforeEach
    void setUp() {
        persistenceService.clearAllScenarios();
    }

    // Updated test: Expects full DTO in response, uses provided ID
    @Test
    void saveScenario_shouldReturnCreatedStatusAndDto() throws Exception {
        // Arrange
        String testId = "integ-test-id-1";
        ScenarioDto scenario = createTestScenario(testId, "Integration Test Scenario");
        String scenarioJson = objectMapper.writeValueAsString(scenario);

        // Act & Assert
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scenarioJson))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.scenarioId", is(testId))) // Check ID in response
                .andExpect(jsonPath("$.scenarioName", is("Integration Test Scenario")))
                .andExpect(jsonPath("$.steps", hasSize(1))) // Check steps array size
                .andExpect(jsonPath("$.steps[0].actionCode", is("actionInteg"))); // Check some step data
    }

    // Updated test: Uses known provided ID for loading
    @Test
    void loadScenario_shouldReturnScenario_whenIdExists() throws Exception {
        // Arrange: Save a scenario with a known ID
        String testId = "load-test-id-2";
        ScenarioDto scenarioToSave = createTestScenario(testId, "Load Test Scenario");
        String saveRequestJson = objectMapper.writeValueAsString(scenarioToSave);

        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveRequestJson))
                .andExpect(status().isCreated()); // Ensure it was saved

        // Act & Assert: Load the scenario using the known ID
        mockMvc.perform(get("/api/scenarios/load/{scenarioId}", testId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.scenarioId", is(testId)))
                .andExpect(jsonPath("$.scenarioName", is("Load Test Scenario")))
                .andExpect(jsonPath("$.steps[0].actionCode", is("actionInteg"))); // Verify some data (using updated field name 'steps')
    }

    @Test
    void loadScenario_shouldReturnNotFound_whenIdDoesNotExist() throws Exception {
        // Arrange
        String nonExistentId = "non-existent-scenario-id-123";

        // Act & Assert
        mockMvc.perform(get("/api/scenarios/load/{scenarioId}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    // Updated test: Checks specifically for missing/empty scenarioId
    @Test
    void saveScenario_shouldReturnBadRequest_whenIdIsNull() throws Exception {
        // Arrange
        // Create DTO without ID (or set to null explicitly if needed)
        ScenarioDto scenario = new ScenarioDto(null, "Bad Request Scenario", List.of());
        String scenarioJson = objectMapper.writeValueAsString(scenario);

        // Act & Assert
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scenarioJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Scenario ID cannot be null or empty")));
    }

     @Test
    void saveScenario_shouldReturnBadRequest_whenIdIsEmpty() throws Exception {
        // Arrange
        ScenarioDto scenario = createTestScenario("", "Empty ID Scenario"); // Use helper with empty ID
        String scenarioJson = objectMapper.writeValueAsString(scenario);

        // Act & Assert
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scenarioJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Scenario ID cannot be null or empty")));
    }

    private ScenarioDto createTestScenario(String id, String name) {
        Map<String, String> stepData1 = Map.of("id", "params-1745418387697-7hj7f", "param_code_0", "1234", "query_targetSystemCode_0", "", "query_collectionMethodCode_1", "");
        Map<String, String> stepData2 = Map.of("id", "request-1745418387697-7hj7f", "field1", "value1", "field2", "value2");
        ScenarioStepDto step1 = new ScenarioStepDto(
            "stepInteg1", 
            "actionInteg", 
            "Integration test context before step", 
            "Integration test expected outcome",
            List.of(stepData1), 
            List.of(stepData2), 
            List.of()
        );
        return new ScenarioDto(id, name, List.of(step1));
    }

    @Test
    void saveScenario_shouldOverwriteExistingScenario() throws Exception {
        // Arrange
        String testId = "overwrite-integ-id";
        ScenarioDto scenario1 = createTestScenario(testId, "Original Integ Scenario");
        ScenarioDto scenario2 = createTestScenario(testId, "Updated Integ Scenario"); // Same ID

        // Save the first version
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scenario1)))
                .andExpect(status().isCreated());

        // Act: Save the second version with the same ID
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scenario2)))
                .andExpect(status().isCreated()) // Should still be CREATED or OK if we define update semantics
                .andExpect(jsonPath("$.scenarioId", is(testId)))
                .andExpect(jsonPath("$.scenarioName", is("Updated Integ Scenario")));

        // Assert: Load and verify the content is updated
        mockMvc.perform(get("/api/scenarios/load/{scenarioId}", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenarioName", is("Updated Integ Scenario")));
    }

    @Test
    void getAllScenarios_shouldReturnAllSavedScenarios() throws Exception {
        // Arrange: Save two scenarios
        String id1 = "all-test-id-1";
        String id2 = "all-test-id-2";
        ScenarioDto scenario1 = createTestScenario(id1, "Scenario One for All");
        ScenarioDto scenario2 = createTestScenario(id2, "Scenario Two for All");

        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scenario1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scenario2)))
                .andExpect(status().isCreated());

        // Act
        MvcResult result = mockMvc.perform(get("/api/scenarios/all"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn(); // Return the result

        // Assert - Manually parse and check
        String responseBody = result.getResponse().getContentAsString();
        // System.out.println("Raw Response Body:\n" + responseBody); // Optional: Add logging to see the raw string
        List<ScenarioDto> returnedScenarios = objectMapper.readValue(responseBody, new TypeReference<List<ScenarioDto>>() {});

        assertEquals(2, returnedScenarios.size(), "Should return exactly 2 scenarios");
        assertTrue(returnedScenarios.stream().anyMatch(s -> s.getScenarioId().equals(id1)), "Scenario with id1 should be present");
        assertTrue(returnedScenarios.stream().anyMatch(s -> s.getScenarioId().equals(id2)), "Scenario with id2 should be present");

        // Keep original jsonPath assertions commented out for now, but they should pass if manual parsing works
        // .andExpect(jsonPath("$", hasSize(2)))
        // .andExpect(jsonPath("$", hasItems(
        //         hasProperty("scenarioId", is(id1)),
        //         hasProperty("scenarioId", is(id2))
        // )));
    }

    @Test
    void saveScenario_shouldPreserveStepDescriptions() throws Exception {
        // Arrange
        String testId = "desc-integ-test-id";
        ScenarioDto scenario = createTestScenario(testId, "Description Integration Test Scenario");
        String scenarioJson = objectMapper.writeValueAsString(scenario);

        // Act & Assert - Save scenario
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scenarioJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.steps[0].beforeDescription", is("Integration test context before step")))
                .andExpect(jsonPath("$.steps[0].afterDescription", is("Integration test expected outcome")));

        // Act & Assert - Load scenario
        mockMvc.perform(get("/api/scenarios/load/{scenarioId}", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steps[0].beforeDescription", is("Integration test context before step")))
                .andExpect(jsonPath("$.steps[0].afterDescription", is("Integration test expected outcome")));
    }
}
