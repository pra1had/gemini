package com.infosys.fbp.platform.scenario.service;

import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDataDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ScenarioPersistenceServiceTest {

    private ScenarioPersistenceService service;

    @BeforeEach
    void setUp() {
        service = new ScenarioPersistenceService();
        // Ensure storage is clear before each test
        service.clearAllScenarios();
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

        ScenarioStepDto step2 = new ScenarioStepDto(
                "step-id-2",
                "actionCode2",
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList()
        );

        return new ScenarioDto(name, List.of(step1, step2));
    }

    @Test
    void saveScenario_shouldStoreScenario() {
        String scenarioId = "test-scenario-1";
        ScenarioDto scenario = createTestScenario("My Test Scenario");

        service.saveScenario(scenarioId, scenario);

        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(scenarioId);
        assertTrue(loadedScenarioOpt.isPresent(), "Scenario should be present after saving.");
        assertEquals(scenario, loadedScenarioOpt.get(), "Loaded scenario should match the saved one.");
        assertEquals("My Test Scenario", loadedScenarioOpt.get().getScenarioName());
        assertEquals(2, loadedScenarioOpt.get().getFlowSteps().size());
    }

    @Test
    void saveScenario_shouldOverwriteExistingScenario() {
        String scenarioId = "test-scenario-overwrite";
        ScenarioDto scenario1 = createTestScenario("Scenario Version 1");
        ScenarioDto scenario2 = createTestScenario("Scenario Version 2");
        scenario2.setFlowSteps(Collections.emptyList()); // Make it different

        service.saveScenario(scenarioId, scenario1);
        service.saveScenario(scenarioId, scenario2); // Save again with the same ID

        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(scenarioId);
        assertTrue(loadedScenarioOpt.isPresent(), "Scenario should still be present.");
        assertEquals(scenario2, loadedScenarioOpt.get(), "Loaded scenario should be the overwritten version.");
        assertEquals("Scenario Version 2", loadedScenarioOpt.get().getScenarioName());
        assertTrue(loadedScenarioOpt.get().getFlowSteps().isEmpty(), "Flow steps should be empty in version 2.");
    }

    @Test
    void saveScenario_shouldThrowExceptionForNullId() {
        ScenarioDto scenario = createTestScenario("Test");
        assertThrows(IllegalArgumentException.class, () -> {
            service.saveScenario(null, scenario);
        }, "Saving with null ID should throw IllegalArgumentException.");
    }

     @Test
    void saveScenario_shouldThrowExceptionForEmptyId() {
        ScenarioDto scenario = createTestScenario("Test");
        assertThrows(IllegalArgumentException.class, () -> {
            service.saveScenario("", scenario);
        }, "Saving with empty ID should throw IllegalArgumentException.");
    }

    @Test
    void saveScenario_shouldThrowExceptionForNullScenario() {
        String scenarioId = "test-scenario-null-dto";
        assertThrows(IllegalArgumentException.class, () -> {
            service.saveScenario(scenarioId, null);
        }, "Saving a null scenario DTO should throw IllegalArgumentException.");
    }

    @Test
    void loadScenario_shouldReturnEmptyOptionalForNonExistentId() {
        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario("non-existent-id");
        assertTrue(loadedScenarioOpt.isEmpty(), "Loading a non-existent scenario should return empty Optional.");
    }

    @Test
    void loadScenario_shouldThrowExceptionForNullId() {
         assertThrows(IllegalArgumentException.class, () -> {
            service.loadScenario(null);
        }, "Loading with null ID should throw IllegalArgumentException.");
    }

    @Test
    void loadScenario_shouldThrowExceptionForEmptyId() {
         assertThrows(IllegalArgumentException.class, () -> {
            service.loadScenario("");
        }, "Loading with empty ID should throw IllegalArgumentException.");
    }

    @Test
    void deleteScenario_shouldRemoveScenario() {
        String scenarioId = "test-scenario-delete";
        ScenarioDto scenario = createTestScenario("To Be Deleted");
        service.saveScenario(scenarioId, scenario);

        assertTrue(service.loadScenario(scenarioId).isPresent(), "Scenario should exist before deletion.");

        boolean deleted = service.deleteScenario(scenarioId);
        assertTrue(deleted, "deleteScenario should return true for existing ID.");
        assertTrue(service.loadScenario(scenarioId).isEmpty(), "Scenario should not exist after deletion.");
    }

    @Test
    void deleteScenario_shouldReturnFalseForNonExistentId() {
        boolean deleted = service.deleteScenario("non-existent-id");
        assertFalse(deleted, "deleteScenario should return false for non-existent ID.");
    }

     @Test
    void deleteScenario_shouldReturnFalseForNullId() {
        boolean deleted = service.deleteScenario(null);
        assertFalse(deleted, "deleteScenario should return false for null ID.");
    }

     @Test
    void deleteScenario_shouldReturnFalseForEmptyId() {
        boolean deleted = service.deleteScenario("");
        assertFalse(deleted, "deleteScenario should return false for empty ID.");
    }

    @Test
    void clearAllScenarios_shouldRemoveAll() {
        service.saveScenario("id1", createTestScenario("Scenario 1"));
        service.saveScenario("id2", createTestScenario("Scenario 2"));

        assertTrue(service.loadScenario("id1").isPresent());
        assertTrue(service.loadScenario("id2").isPresent());

        service.clearAllScenarios();

        assertTrue(service.loadScenario("id1").isEmpty(), "Scenario 1 should be gone after clearAll.");
        assertTrue(service.loadScenario("id2").isEmpty(), "Scenario 2 should be gone after clearAll.");
    }
}
