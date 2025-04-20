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

    @GetMapping("/action-codes")
    public ResponseEntity<List<ActionCodeInfo>> getActionCodes() {
        List<ActionCodeInfo> actionCodes = actionCodeService.generateActionCodeList();
        // Consider adding error handling or checking if the list is empty
        return ResponseEntity.ok(actionCodes);
    }
}
