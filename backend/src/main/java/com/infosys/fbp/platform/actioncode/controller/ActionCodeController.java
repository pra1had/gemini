package com.infosys.fbp.platform.actioncode.controller;

import com.infosys.fbp.platform.actioncode.dto.ActionCodeInfo;
import com.infosys.fbp.platform.actioncode.service.ActionCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api") // Base path for this controller
@RequiredArgsConstructor // Lombok annotation for constructor injection
public class ActionCodeController {

    private final ActionCodeService actionCodeService;

    /**
     * Retrieves the list of available actions (action codes) for the frontend Scenario Workbench.
     * This provides the same data as `/api/action-codes` but serves as the primary endpoint
     * for the frontend application based on requirements.
     *
     * @return ResponseEntity containing the list of ActionCodeInfo objects.
     */
    @GetMapping("/actions") // New endpoint for the frontend
    public ResponseEntity<List<ActionCodeInfo>> getActionsForFrontend() {
        List<ActionCodeInfo> actionCodes = actionCodeService.generateActionCodeList();
        // Consider adding error handling or checking if the list is empty
        return ResponseEntity.ok(actionCodes);
    }
}
