package com.infosys.fbp.platform.actioncode.dto;

import com.fasterxml.jackson.annotation.JsonProperty; // Import JsonProperty
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data // Lombok annotation for getters, setters, toString, equals, hashCode
@NoArgsConstructor
@AllArgsConstructor
public class ParameterInfo {
    private String technicalColumnName;
    @JsonProperty("isMandatory") // Explicitly map JSON property name
    private boolean isMandatory;
    private String derivedDataType; // Using description field as per plan
}
