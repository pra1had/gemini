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

    // Updated test to reflect new save behavior (using provided ID and returning DTO)
    @Test
    void saveScenario_shouldStoreScenarioAndReturnDto() {
        // Arrange
        String testId = "test-id-1";
        ScenarioDto scenario = createTestScenario(testId, "Test Scenario 1");

        // Act
        ScenarioDto savedScenario = service.saveScenario(scenario);

        // Assert
        assertNotNull(savedScenario);
        assertEquals(testId, savedScenario.getScenarioId()); // Check if ID is preserved
        assertEquals(scenario.getScenarioName(), savedScenario.getScenarioName());
        assertEquals(scenario.getSteps(), savedScenario.getSteps());

        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(testId);
        assertTrue(loadedScenarioOpt.isPresent());
        assertEquals(scenario, loadedScenarioOpt.get()); // Ensure the stored object matches
        assertEquals("Test Scenario 1", loadedScenarioOpt.get().getScenarioName());
    }

    // Updated test to use provided ID
    @Test
    void loadScenario_shouldReturnScenario_whenIdExists() {
        // Arrange
        String testId = "test-id-2";
        ScenarioDto scenario = createTestScenario(testId, "Test Scenario 2");
        service.saveScenario(scenario); // Save using the provided ID

        // Act
        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(testId);

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

    // Updated test to use provided IDs
    @Test
    void saveScenario_shouldHandleMultipleSavesWithDifferentIds() {
        // Arrange
        String id1 = "scenario-a-id";
        String id2 = "scenario-b-id";
        ScenarioDto scenario1 = createTestScenario(id1, "Scenario A");
        ScenarioDto scenario2 = createTestScenario(id2, "Scenario B");

        // Act
        ScenarioDto saved1 = service.saveScenario(scenario1);
        ScenarioDto saved2 = service.saveScenario(scenario2);

        // Assert
        assertNotNull(saved1);
        assertNotNull(saved2);
        assertEquals(id1, saved1.getScenarioId());
        assertEquals(id2, saved2.getScenarioId());

        Optional<ScenarioDto> loaded1 = service.loadScenario(id1);
        Optional<ScenarioDto> loaded2 = service.loadScenario(id2);

        assertTrue(loaded1.isPresent());
        assertEquals("Scenario A", loaded1.get().getScenarioName());
        assertTrue(loaded2.isPresent());
        assertEquals("Scenario B", loaded2.get().getScenarioName());
    }

    // Updated helper method to include scenarioId
    private ScenarioDto createTestScenario(String id, String name) {
        ScenarioStepDataDto stepData1 = new ScenarioStepDataDto("row1", Map.of("param1", "value1"));
        ScenarioStepDataDto stepData2 = new ScenarioStepDataDto("row2", Map.of("reqField", 123));
        ScenarioStepDto step1 = new ScenarioStepDto("step1", "actionA", List.of(stepData1), List.of(stepData2), List.of());
        // Use the updated ScenarioDto constructor/fields
        return new ScenarioDto(id, name, List.of(step1));
    }

    @Test
    void saveScenario_shouldThrowException_whenIdIsNull() {
        // Arrange
        ScenarioDto scenario = createTestScenario(null, "Null ID Scenario"); // Pass null ID

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            service.saveScenario(scenario);
        });
        assertEquals("Scenario ID cannot be null or empty for saving.", exception.getMessage());
    }

     @Test
    void saveScenario_shouldThrowException_whenIdIsEmpty() {
        // Arrange
        ScenarioDto scenario = createTestScenario("", "Empty ID Scenario"); // Pass empty ID

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            service.saveScenario(scenario);
        });
        assertEquals("Scenario ID cannot be null or empty for saving.", exception.getMessage());
    }

     @Test
    void saveScenario_shouldOverwriteExistingScenarioWithSameId() {
        // Arrange
        String testId = "overwrite-id";
        ScenarioDto scenario1 = createTestScenario(testId, "Original Scenario");
        ScenarioDto scenario2 = createTestScenario(testId, "Updated Scenario"); // Same ID, different name

        // Act
        service.saveScenario(scenario1); // Save original
        ScenarioDto savedScenario2 = service.saveScenario(scenario2); // Save updated

        // Assert
        assertEquals(testId, savedScenario2.getScenarioId());
        assertEquals("Updated Scenario", savedScenario2.getScenarioName());

        Optional<ScenarioDto> loadedScenarioOpt = service.loadScenario(testId);
        assertTrue(loadedScenarioOpt.isPresent());
        assertEquals("Updated Scenario", loadedScenarioOpt.get().getScenarioName()); // Verify overwrite
        assertEquals(scenario2.getSteps(), loadedScenarioOpt.get().getSteps());
    }
}
