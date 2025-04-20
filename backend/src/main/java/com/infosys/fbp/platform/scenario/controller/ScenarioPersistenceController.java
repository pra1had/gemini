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
     * Saves or updates a scenario temporarily using the ID provided within the DTO.
     *
     * @param scenarioDto The scenario data received in the request body, including the scenarioId.
     * @return A response entity containing the saved ScenarioDto.
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveScenario(@RequestBody ScenarioDto scenarioDto) { // Return type changed
        // Basic validation: Ensure scenarioDto and scenarioId are not null/empty
        if (scenarioDto == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Scenario data cannot be null"));
        }
        if (scenarioDto.getScenarioId() == null || scenarioDto.getScenarioId().trim().isEmpty()) {
             return ResponseEntity.badRequest().body(Map.of("error", "Scenario ID cannot be null or empty"));
        }
        // Further validation could be added here (e.g., check name, steps)

        try {
            // Pass the full DTO (including the user-provided ID) to the service
            ScenarioDto savedScenario = persistenceService.saveScenario(scenarioDto);
            // Return the full saved DTO
            return ResponseEntity.status(HttpStatus.CREATED).body(savedScenario);
        } catch (IllegalArgumentException e) {
             // Handle specific exceptions like potential ID conflicts if the service throws them
             return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Log the exception details properly in a real application
            // log.error("Error saving scenario {}: {}", scenarioDto.getScenarioId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Failed to save scenario due to an internal error: " + e.getMessage()));
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
