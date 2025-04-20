package com.infosys.fbp.platform.scenario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.fbp.platform.App;
import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDataDto;
import com.infosys.fbp.platform.scenario.service.ScenarioPersistenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = App.class)
@AutoConfigureMockMvc
class ScenarioPersistenceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ScenarioPersistenceService persistenceService; // Inject service to clear state

    @BeforeEach
    void setUp() {
        // Clear the in-memory storage before each test
        persistenceService.clearAllScenarios();
    }

    private ScenarioDto createTestScenario(String name) {
        ScenarioStepDataDto step1ParamData = new ScenarioStepDataDto("p1", Map.of("paramKey", "paramValue"));
        ScenarioStepDataDto step1ReqData = new ScenarioStepDataDto("r1", Map.of("reqKey", "reqValue"));
        ScenarioStepDataDto step1ResData = new ScenarioStepDataDto("v1", Map.of("resKey", "resValue"));

        ScenarioStepDto step1 = new ScenarioStepDto(
                "step-id-1",
                "actionCode1",
                List.of(step1ParamData),
                List.of(step1ReqData),
                List.of(step1ResData)
        );
        return new ScenarioDto(name, List.of(step1));
    }

    @Test
    void saveTemporaryScenario_shouldReturnOk() throws Exception {
        String scenarioId = "integration-test-1";
        ScenarioDto scenario = createTestScenario("Integration Test Scenario");

        mockMvc.perform(post("/api/scenarios/{scenarioId}", scenarioId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scenario)))
                .andExpect(status().isOk());

        // Verify it was actually saved using the service
        assertTrue(persistenceService.loadScenario(scenarioId).isPresent(), "Scenario should be saved in service.");
        assertEquals(scenario, persistenceService.loadScenario(scenarioId).get());
    }

    @Test
    void saveTemporaryScenario_shouldReturnBadRequestForInvalidId() throws Exception {
        ScenarioDto scenario = createTestScenario("Bad ID Test");

        // Test with empty ID in path
        mockMvc.perform(post("/api/scenarios/ ") // Empty path segment might be tricky, test with space
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scenario)))
                .andExpect(status().isBadRequest()); // Expecting 400 Bad Request due to service validation
    }

    @Test
    void saveTemporaryScenario_shouldReturnBadRequestForNullBody() throws Exception {
        String scenarioId = "null-body-test";

        mockMvc.perform(post("/api/scenarios/{scenarioId}", scenarioId)
                        .contentType(MediaType.APPLICATION_JSON)) // No content body
                .andExpect(status().isBadRequest()); // Spring usually handles missing body as 400
    }


    @Test
    void loadTemporaryScenario_shouldReturnScenarioWhenExists() throws Exception {
        String scenarioId = "load-test-1";
        ScenarioDto scenario = createTestScenario("Load Me");
        persistenceService.saveScenario(scenarioId, scenario); // Pre-populate using service

        mockMvc.perform(get("/api/scenarios/{scenarioId}", scenarioId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.scenarioName", is("Load Me")))
                .andExpect(jsonPath("$.flowSteps.length()", is(1)))
                .andExpect(jsonPath("$.flowSteps[0].actionCode", is("actionCode1")))
                .andExpect(jsonPath("$.flowSteps[0].stepParamsData[0].id", is("p1")))
                .andExpect(jsonPath("$.flowSteps[0].stepParamsData[0].data.paramKey", is("paramValue")));
    }

    @Test
    void loadTemporaryScenario_shouldReturnNotFoundWhenNotExists() throws Exception {
        String scenarioId = "does-not-exist";

        mockMvc.perform(get("/api/scenarios/{scenarioId}", scenarioId))
                .andExpect(status().isNotFound());
    }

    @Test
    void loadTemporaryScenario_shouldReturnBadRequestForInvalidId() throws Exception {
         // Test with empty ID in path
        mockMvc.perform(get("/api/scenarios/ ")) // Empty path segment might be tricky, test with space
                .andExpect(status().isBadRequest()); // Expecting 400 Bad Request due to service validation
    }
}
