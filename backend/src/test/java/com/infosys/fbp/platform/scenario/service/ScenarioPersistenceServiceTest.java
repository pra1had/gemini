package com.infosys.fbp.platform.scenario.service;

import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioStepDataDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ScenarioPersistenceServiceTest {

    private ScenarioPersistenceService service;

    @BeforeEach
    void setUp() {
        service = new ScenarioPersistenceService();
    }

    @Test
    void saveScenario_shouldStoreScenarioAndReturnId() {
        // Arrange
        ScenarioDto scenario = createTestScenario("Test Scenario 1");

        // Act
        String scenarioId = service.saveScenario(scenario);

        // Assert
        assertNotNull(scenarioId);
        assertFalse(scenarioId.isEmpty());

        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(scenarioId);
        assertTrue(loadedScenarioOpt.isPresent());
        assertEquals(scenario, loadedScenarioOpt.get());
        assertEquals("Test Scenario 1", loadedScenarioOpt.get().getScenarioName());
    }

    @Test
    void loadScenario_shouldReturnScenario_whenIdExists() {
        // Arrange
        ScenarioDto scenario = createTestScenario("Test Scenario 2");
        String scenarioId = service.saveScenario(scenario);

        // Act
        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(scenarioId);

        // Assert
        assertTrue(loadedScenarioOpt.isPresent());
        assertEquals(scenario, loadedScenarioOpt.get());
    }

    @Test
    void loadScenario_shouldReturnEmpty_whenIdDoesNotExist() {
        // Arrange
        String nonExistentId = "non-existent-id";

        // Act
        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(nonExistentId);

        // Assert
        assertFalse(loadedScenarioOpt.isPresent());
    }

    @Test
    void saveScenario_shouldHandleMultipleSaves() {
        // Arrange
        ScenarioDto scenario1 = createTestScenario("Scenario A");
        ScenarioDto scenario2 = createTestScenario("Scenario B");

        // Act
        String id1 = service.saveScenario(scenario1);
        String id2 = service.saveScenario(scenario2);

        // Assert
        assertNotNull(id1);
        assertNotNull(id2);
        assertNotEquals(id1, id2);

        Optional<ScenarioDto> loaded1 = service.loadScenario(id1);
        Optional<ScenarioDto> loaded2 = service.loadScenario(id2);

        assertTrue(loaded1.isPresent());
        assertEquals("Scenario A", loaded1.get().getScenarioName());
        assertTrue(loaded2.isPresent());
        assertEquals("Scenario B", loaded2.get().getScenarioName());
    }

    // Helper method to create a simple test scenario DTO
    private ScenarioDto createTestScenario(String name) {
        ScenarioStepDataDto stepData1 = new ScenarioStepDataDto("row1", Map.of("param1", "value1"));
        ScenarioStepDataDto stepData2 = new ScenarioStepDataDto("row2", Map.of("reqField", 123));
        ScenarioStepDto step1 = new ScenarioStepDto("step1", "actionA", List.of(stepData1), List.of(stepData2), List.of());
        return new ScenarioDto(name, List.of(step1));
    }
}
