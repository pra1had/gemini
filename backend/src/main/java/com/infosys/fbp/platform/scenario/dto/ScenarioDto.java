package com.infosys.fbp.platform.scenario.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * Represents the complete scenario data structure to be saved or loaded
 * for temporary persistence. Corresponds to the relevant parts of
 * ScenarioState in the frontend store.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioDto {

    /**
     * The unique identifier for the scenario. Provided by the user on creation.
     */
    private String scenarioId;

    /**
     * The name of the scenario.
     */
    private String scenarioName;

    /**
     * The ordered list of steps in the scenario flow.
     * Note: Field name changed from 'flowSteps' to 'steps' to match frontend store expectation.
     */
    private List<ScenarioStepDto> steps;

}
