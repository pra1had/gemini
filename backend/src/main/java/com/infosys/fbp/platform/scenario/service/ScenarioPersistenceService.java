package com.infosys.fbp.platform.scenario.service;

import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import org.springframework.stereotype.Service;

import java.util.Collection; // Added import
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for temporary in-memory persistence of scenarios.
 */
@Service
public class ScenarioPersistenceService {

    // Use ConcurrentHashMap for basic thread safety in a web environment
    private final Map<String, ScenarioDto> scenarioStore = new ConcurrentHashMap<>();

    /**
     * Saves or updates a scenario in the in-memory store using the ID from the DTO.
     *
     * @param scenarioDto The scenario data to save, including the scenarioId.
     * @return The saved ScenarioDto object.
     */
    public ScenarioDto saveScenario(ScenarioDto scenarioDto) {
        // Use the ID provided in the DTO
        String scenarioId = scenarioDto.getScenarioId();
        if (scenarioId == null || scenarioId.trim().isEmpty()) {
            // This should ideally be caught by the controller, but double-check
            throw new IllegalArgumentException("Scenario ID cannot be null or empty for saving.");
        }
        // Store the DTO using the provided ID as the key
        scenarioStore.put(scenarioId, scenarioDto);
        // Consider logging the save/update operation
        // log.info("Scenario saved/updated with ID: {}", scenarioId);
        // Return the saved DTO
        return scenarioDto;
    }

    /**
     * Loads a scenario from the in-memory store by its ID.
     *
     * @param scenarioId The unique ID of the scenario to load.
     * @return An Optional containing the ScenarioDto if found, otherwise empty.
     */
    public Optional<ScenarioDto> loadScenario(String scenarioId) {
        // Consider logging the load attempt
        // log.info("Attempting to load scenario with ID: {}", scenarioId);
        return Optional.ofNullable(scenarioStore.get(scenarioId));
    }

    /**
     * Retrieves all scenarios currently stored in memory.
     *
     * @return A collection of all ScenarioDto objects.
     */
    public Collection<ScenarioDto> getAllScenarios() {
        // Consider logging the retrieval operation
        // log.info("Retrieving all {} scenarios.", scenarioStore.size());
        return scenarioStore.values();
    }

    // Optional: Method to clear the store or remove specific entries if needed
    // public void removeScenario(String scenarioId) {
    //     scenarioStore.remove(scenarioId);
    // }

    /**
     * Clears all scenarios from the in-memory store.
     * Primarily intended for testing purposes.
     */
    public void clearAllScenarios() {
        scenarioStore.clear();
        // Consider logging the clear operation
        // log.warn("Cleared all scenarios from the store.");
    }
}
