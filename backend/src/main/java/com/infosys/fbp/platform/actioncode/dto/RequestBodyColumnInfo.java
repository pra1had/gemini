package com.infosys.fbp.platform.actioncode.dto;

import com.fasterxml.jackson.annotation.JsonProperty; // Import JsonProperty
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestBodyColumnInfo {
    private String technicalColumnName;
    @JsonProperty("isMandatory") // Explicitly map JSON property name
    private boolean isMandatory;
    private String derivedDataType; // Path from root data schema as per plan
    private String attributePath; // New field: derivedDataType + ":" + technicalColumnName (for grid field ID)
    private String attributeGridPath; // New field: derivedDataType + ":" + technicalColumnName (for grid header)
}
