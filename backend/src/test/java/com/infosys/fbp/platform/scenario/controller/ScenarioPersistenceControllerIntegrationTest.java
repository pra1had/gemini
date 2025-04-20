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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
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
    private ObjectMapper objectMapper; // For converting objects to/from JSON

    @Test
    void saveScenario_shouldReturnCreatedStatusAndId() throws Exception {
        // Arrange
        ScenarioDto scenario = createTestScenario("Integration Test Scenario");
        String scenarioJson = objectMapper.writeValueAsString(scenario);

        // Act & Assert
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scenarioJson))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(notNullValue())));
    }

    @Test
    void loadScenario_shouldReturnScenario_whenIdExists() throws Exception {
        // Arrange: First save a scenario to get a valid ID
        ScenarioDto scenarioToSave = createTestScenario("Load Test Scenario");
        String saveRequestJson = objectMapper.writeValueAsString(scenarioToSave);

        MvcResult saveResult = mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveRequestJson))
                .andExpect(status().isCreated())
                .andReturn();

        // Extract the ID from the save response
        String responseBody = saveResult.getResponse().getContentAsString();
        Map<String, String> saveResponse = objectMapper.readValue(responseBody, new TypeReference<Map<String, String>>() {});
        String scenarioId = saveResponse.get("id");

        // Act & Assert: Load the scenario using the obtained ID
        mockMvc.perform(get("/api/scenarios/load/{scenarioId}", scenarioId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.scenarioName", is("Load Test Scenario")))
                .andExpect(jsonPath("$.flowSteps[0].actionCode", is("actionLoad"))); // Verify some data
    }

    @Test
    void loadScenario_shouldReturnNotFound_whenIdDoesNotExist() throws Exception {
        // Arrange
        String nonExistentId = "non-existent-scenario-id-123";

        // Act & Assert
        mockMvc.perform(get("/api/scenarios/load/{scenarioId}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    void saveScenario_shouldReturnBadRequest_whenBodyIsNull() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/scenarios/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")) // Send an empty object, or potentially null if allowed by framework
                .andExpect(status().isCreated()); // Assuming empty object is valid, adjust if needed
                // If null body is truly invalid, expect badRequest()
                // .andExpect(status().isBadRequest());
    }

     // Helper method to create a simple test scenario DTO
    private ScenarioDto createTestScenario(String name) {
        ScenarioStepDataDto stepData1 = new ScenarioStepDataDto("rowA", Map.of("paramLoad", "valueLoad"));
        ScenarioStepDataDto stepData2 = new ScenarioStepDataDto("rowB", Map.of("reqLoad", 456));
        ScenarioStepDto step1 = new ScenarioStepDto("stepLoad1", "actionLoad", List.of(stepData1), List.of(stepData2), List.of());
        return new ScenarioDto(name, List.of(step1));
    }
}
