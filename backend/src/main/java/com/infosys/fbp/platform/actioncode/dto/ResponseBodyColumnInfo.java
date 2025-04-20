package com.infosys.fbp.platform.actioncode.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Represents a flattened column/field derived from an API response body schema.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponseBodyColumnInfo {
    /**
     * The technical name of the field (e.g., "userId", "orderDate").
     */
    private String technicalColumnName;

    /**
     * Indicates if the field is typically expected in the response.
     * Note: OpenAPI 'required' is less common/enforced for responses compared to requests.
     * This might represent whether the field is *defined* rather than strictly mandatory.
     */
    private boolean mandatory; // Or consider renaming to 'defined' or similar if 'mandatory' is misleading for responses

    /**
     * A derived path indicating the field's location in the original nested structure,
     * prefixed with ":response". Example: ":response:data:id", ":response:errors:code".
     */
    private String derivedDataType;
}
