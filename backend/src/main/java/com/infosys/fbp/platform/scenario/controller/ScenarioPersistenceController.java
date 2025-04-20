package com.infosys.fbp.platform.scenario.controller;

import com.infosys.fbp.platform.scenario.dto.ScenarioDto;
import com.infosys.fbp.platform.scenario.service.ScenarioPersistenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST Controller for handling scenario persistence operations (initially temporary).
 */
@RestController
@RequestMapping("/api/scenarios") // Base path for scenario persistence endpoints
public class ScenarioPersistenceController {

    private final ScenarioPersistenceService persistenceService;

    @Autowired
    public ScenarioPersistenceController(ScenarioPersistenceService persistenceService) {
        this.persistenceService = persistenceService;
    }

    /**
     * Saves or updates a scenario temporarily.
     *
     * @param scenarioId The unique ID for the scenario.
     * @param scenarioDto The scenario data from the request body.
     * @return ResponseEntity indicating success (200 OK) or failure (e.g., 400 Bad Request).
     */
    @PostMapping("/{scenarioId}")
    public ResponseEntity<Void> saveTemporaryScenario(
            @PathVariable String scenarioId,
            @RequestBody ScenarioDto scenarioDto) {
        try {
            persistenceService.saveScenario(scenarioId, scenarioDto);
            return ResponseEntity.ok().build(); // Indicate success with 200 OK
        } catch (IllegalArgumentException e) {
            // Handle cases like null/empty ID or null DTO
            return ResponseEntity.badRequest().build(); // Indicate client error with 400 Bad Request
        } catch (Exception e) {
            // Log the exception in a real application
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // Indicate server error
        }
    }

    /**
     * Loads a temporarily saved scenario.
     *
     * @param scenarioId The unique ID for the scenario to load.
     * @return ResponseEntity containing the ScenarioDto (200 OK) if found,
     *         or 404 Not Found if the scenario doesn't exist,
     *         or 400 Bad Request for invalid ID.
     */
    @GetMapping("/{scenarioId}")
    public ResponseEntity<ScenarioDto> loadTemporaryScenario(@PathVariable String scenarioId) {
        try {
            Optional<ScenarioDto> scenarioOpt = persistenceService.loadScenario(scenarioId);
            return scenarioOpt
                    .map(ResponseEntity::ok) // If present, return 200 OK with the DTO
                    .orElseGet(() -> ResponseEntity.notFound().build()); // If not present, return 404 Not Found
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build(); // Indicate client error (invalid ID) with 400 Bad Request
        } catch (Exception e) {
            // Log the exception in a real application
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // Indicate server error
        }
    }

    // Optional: Add an endpoint for deleting a temporary scenario if needed
    // @DeleteMapping("/{scenarioId}")
    // public ResponseEntity<Void> deleteTemporaryScenario(@PathVariable String scenarioId) { ... }
}
