package com.infosys.fbp.platform.scenario.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDataDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
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
    } // <-- Add missing closing brace here
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

     // Updated helper method to include scenarioId
    private ScenarioDto createTestScenario(String id, String name) {
        ScenarioStepDataDto stepData1 = new ScenarioStepDataDto("rowA", Map.of("paramInteg", "valueInteg"));
        ScenarioStepDataDto stepData2 = new ScenarioStepDataDto("rowB", Map.of("reqInteg", 456));
        ScenarioStepDto step1 = new ScenarioStepDto("stepInteg1", "actionInteg", List.of(stepData1), List.of(stepData2), List.of());
        // Use updated DTO structure
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
}
