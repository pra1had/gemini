package com.infosys.fbp.platform.actioncode.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.Map;
import java.util.Collections; // Import Collections

@Data // Lombok annotation for getters, setters, toString, equals, hashCode
@JsonIgnoreProperties(ignoreUnknown = true) // Ignore any extra fields in JSON
public class ComponentDetail {

    // Map of actionCode -> schemaPath (e.g., "create-demandCode": "create-demandCode.json")
    private Map<String, String> apiSchemas = Collections.emptyMap(); // Initialize to avoid nulls
}
