package com.infosys.fbp.platform.scenario.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Map;

/**
 * Represents a single row of data within a scenario step's grid (params, request, or response).
 * Corresponds to StepRowData in the frontend store.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioStepDataDto {

    /**
     * The unique identifier for this row within its grid.
     * Can be a number or a string from the frontend.
     */
    private Object id; // Use Object to accommodate number or string

    /**
     * The actual data for the row, represented as key-value pairs.
     * Keys correspond to column technical names (e.g., parameter names, JSON field paths).
     */
    private Map<String, Object> data; // Using Object for flexibility in value types

}
