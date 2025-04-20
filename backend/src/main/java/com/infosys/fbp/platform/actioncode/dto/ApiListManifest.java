package com.infosys.fbp.platform.actioncode.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.Map;
import java.util.Collections; // Import Collections

@Data // Lombok annotation for getters, setters, toString, equals, hashCode
@JsonIgnoreProperties(ignoreUnknown = true) // Ignore any extra fields in JSON
public class ApiListManifest {

    // Map of componentName -> ComponentDetail (e.g., "Collection": ComponentDetail)
    private Map<String, ComponentDetail> components = Collections.emptyMap(); // Initialize to avoid nulls
}
