package com.infosys.fbp.platform.actioncode.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathPropertyListMap {
    private List<ParameterInfo> PathParamList = new ArrayList<>();
    private List<ParameterInfo> QueryParamList = new ArrayList<>();
    // Assuming RequestBodyColumnList and ResponseBodyColumnList will be handled
    // in the main ActionCodeInfo DTO or processed differently based on final needs,
    // as the PRD focused on Path and Query params for this specific map structure.
    // If they are needed here, they can be added.
}
