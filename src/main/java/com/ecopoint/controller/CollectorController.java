package com.ecopoint.controller;

import com.ecopoint.dto.DepositResponse;
import com.ecopoint.dto.PickupRequest;
import com.ecopoint.entity.User;
import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.service.AuthService;
import com.ecopoint.service.DepositService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/collector")
public class CollectorController {

    private final AuthService authService;
    private final DepositService depositService;

    public CollectorController(AuthService authService, DepositService depositService) {
        this.authService = authService;
        this.depositService = depositService;
    }

    @GetMapping("/pending-pickups")
    public ResponseEntity<List<DepositResponse>> getPendingPickups() {
        return ResponseEntity.ok(depositService.getPendingPickups());
    }

    @PostMapping("/deposits/{id}/pickup")
    public ResponseEntity<DepositResponse> confirmPickup(
            @PathVariable Long id,
            @RequestBody(required = false) PickupRequest req,
            Principal principal) {
        User collector = authService.getByEmail(principal.getName());
        String notes = req != null ? req.getCollectorNotes() : null;
        WasteDeposit deposit = depositService.confirmPickup(id, collector, notes);
        return ResponseEntity.ok(depositService.toResponse(deposit));
    }
}
