package com.infosys.fbp.platform.scenario.controller;

import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.service.ScenarioPersistenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for handling temporary persistence of scenarios.
 */
@RestController
@RequestMapping("/api/scenarios")
public class ScenarioPersistenceController {

    private final ScenarioPersistenceService persistenceService;

    @Autowired
    public ScenarioPersistenceController(ScenarioPersistenceService persistenceService) {
        this.persistenceService = persistenceService;
    }

    /**
     * Saves a scenario temporarily.
     *
     * @param scenarioDto The scenario data received in the request body.
     * @return A response entity containing the generated scenario ID.
     */
    @PostMapping("/save")
    public ResponseEntity<Map<String, String>> saveScenario(@RequestBody ScenarioDto scenarioDto) {
        // Basic validation: Ensure scenarioDto is not null
        if (scenarioDto == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Scenario data cannot be null"));
        }
        // Further validation could be added here (e.g., check if flowSteps is null/empty)

        try {
            String scenarioId = persistenceService.saveScenario(scenarioDto);
            // Return the ID in a simple JSON object: {"id": "..."}
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", scenarioId));
        } catch (Exception e) {
            // Log the exception details properly in a real application
            // log.error("Error saving scenario: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Failed to save scenario due to an internal error."));
        }
    }

    /**
     * Loads a scenario temporarily by its ID.
     *
     * @param scenarioId The ID of the scenario to load, passed as a path variable.
     * @return A response entity containing the ScenarioDto if found, or 404 Not Found.
     */
    @GetMapping("/load/{scenarioId}")
    public ResponseEntity<ScenarioDto> loadScenario(@PathVariable String scenarioId) {
        Optional<ScenarioDto> scenarioOpt = persistenceService.loadScenario(scenarioId);

        return scenarioOpt
                .map(ResponseEntity::ok) // If present, return 200 OK with the scenario
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scenario not found with ID: " + scenarioId)); // If not present, throw 404
    }

    // TODO: Consider adding endpoints for update and delete if needed for temporary persistence.
}
