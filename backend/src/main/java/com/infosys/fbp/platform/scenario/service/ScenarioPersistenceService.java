package com.infosys.fbp.platform.scenario.service;

import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import org.springframework.stereotype.Service;

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
     * Saves a scenario to the in-memory store.
     *
     * @param scenarioDto The scenario data to save.
     * @return The generated unique ID for the saved scenario.
     */
    public String saveScenario(ScenarioDto scenarioDto) {
        String scenarioId = UUID.randomUUID().toString();
        scenarioStore.put(scenarioId, scenarioDto);
        // Consider logging the save operation
        // log.info("Scenario saved with ID: {}", scenarioId);
        return scenarioId;
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

    // Optional: Method to clear the store or remove specific entries if needed
    // public void removeScenario(String scenarioId) {
    //     scenarioStore.remove(scenarioId);
    // }
    //
    // public void clearAllScenarios() {
    //     scenarioStore.clear();
    // }
}
