package com.ecopoint.controller;

import com.ecopoint.dto.DepositResponse;
import com.ecopoint.dto.VerificationRequest;
import com.ecopoint.entity.User;
import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.service.AuthService;
import com.ecopoint.service.DepositService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facility")
public class FacilityController {

    private final AuthService authService;
    private final DepositService depositService;

    public FacilityController(AuthService authService, DepositService depositService) {
        this.authService = authService;
        this.depositService = depositService;
    }

    @GetMapping("/queue")
    public ResponseEntity<List<DepositResponse>> getQueue() {
        return ResponseEntity.ok(depositService.getIncomingToFacility());
    }

    @PostMapping("/deposits/{id}/receive")
    public ResponseEntity<DepositResponse> receiveAtFacility(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal) {
        User operator = authService.getByEmail(principal.getName());
        String notes = body != null ? body.get("notes") : null;
        WasteDeposit deposit = depositService.markAtFacility(id, operator, notes);
        return ResponseEntity.ok(depositService.toResponse(deposit));
    }

    @PostMapping("/deposits/{id}/verify")
    public ResponseEntity<DepositResponse> verifyDeposit(
            @PathVariable Long id,
            @Valid @RequestBody VerificationRequest req,
            Principal principal) {
        User operator = authService.getByEmail(principal.getName());
        WasteDeposit deposit = depositService.verifyDeposit(id, operator, req);
        return ResponseEntity.ok(depositService.toResponse(deposit));
    }
}
