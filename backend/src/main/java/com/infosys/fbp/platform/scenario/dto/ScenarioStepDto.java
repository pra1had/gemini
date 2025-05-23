package com.infosys.fbp.platform.scenario.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Represents a single step within a scenario flow.
 * Corresponds to ScenarioStep in the frontend store.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioStepDto {

    /**
     * Unique identifier for this step instance within the flow.
     */
    private String id;

    /**
     * The action code associated with this step, referencing an Action.
     */
    private String actionCode;

    /**
     * Description of the context before this step is executed.
     */
    private String beforeDescription;

    /**
     * Description of the expected outcome after this step is executed.
     */
    private String afterDescription;

    /**
     * Data rows for the Path/Query Parameters grid for this step.
     */
    private List<Map<String, String>> stepParamsData;

    /**
     * Data rows for the Request Body grid for this step.
     */
    private List<Map<String, String>> stepRequestData;

    /**
     * Data rows for the Response Body Verification grid for this step.
     */
    private List<Map<String, String>> stepResponseData;

}
