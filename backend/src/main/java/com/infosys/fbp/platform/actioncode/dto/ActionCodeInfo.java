package com.infosys.fbp.platform.actioncode.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Import JsonIgnoreProperties
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // Ignore properties not defined in the DTO
public class ActionCodeInfo {
    private String componentName;
    private String actionCodeGroupName;
    private String actionCode;
    private String endPoint;
    private String type; // e.g., "PostAndVerify", "FetchAndVerify"
    private PathPropertyListMap pathPropertyListMap = new PathPropertyListMap();
    private List<RequestBodyColumnInfo> requestBodyColumnList = new ArrayList<>(); // Renamed to camelCase
    private List<ResponseBodyColumnInfo> responseBodyColumnList = new ArrayList<>(); // Added for response processing
}
