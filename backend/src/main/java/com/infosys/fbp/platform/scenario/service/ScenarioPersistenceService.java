package com.infosys.fbp.platform.scenario.service;

import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for temporary in-memory persistence of scenarios.
 */
@Service
public class ScenarioPersistenceService {

    // Use ConcurrentHashMap for thread safety if multiple requests might access it concurrently
    private final Map<String, ScenarioDto> temporaryStorage = new ConcurrentHashMap<>();

    /**
     * Saves or updates a scenario in the temporary storage.
     *
     * @param scenarioId The unique identifier for the scenario.
     * @param scenarioDto The scenario data to save.
     */
    public void saveScenario(String scenarioId, ScenarioDto scenarioDto) {
        if (scenarioId == null || scenarioId.isBlank()) {
            throw new IllegalArgumentException("Scenario ID cannot be null or empty.");
        }
        if (scenarioDto == null) {
            throw new IllegalArgumentException("Scenario data cannot be null.");
        }
        temporaryStorage.put(scenarioId, scenarioDto);
        // In a real application, consider logging successful save
    }

    /**
     * Loads a scenario from the temporary storage.
     *
     * @param scenarioId The unique identifier for the scenario to load.
     * @return An Optional containing the ScenarioDto if found, otherwise an empty Optional.
     */
    public Optional<ScenarioDto> loadScenario(String scenarioId) {
        if (scenarioId == null || scenarioId.isBlank()) {
            // Or return Optional.empty() depending on desired behavior for invalid IDs
            throw new IllegalArgumentException("Scenario ID cannot be null or empty.");
        }
        return Optional.ofNullable(temporaryStorage.get(scenarioId));
    }

    /**
     * Deletes a scenario from the temporary storage.
     * (Optional, might be useful for cleanup or explicit deletion)
     *
     * @param scenarioId The unique identifier for the scenario to delete.
     * @return true if a scenario was removed, false otherwise.
     */
    public boolean deleteScenario(String scenarioId) {
         if (scenarioId == null || scenarioId.isBlank()) {
            return false; // Or throw exception
        }
        return temporaryStorage.remove(scenarioId) != null;
    }

    /**
     * Clears all scenarios from temporary storage.
     * (Useful for testing or specific reset scenarios)
     */
    public void clearAllScenarios() {
        temporaryStorage.clear();
    }
}
