package com.ecopoint.controller;

import com.ecopoint.dto.DepositRequest;
import com.ecopoint.dto.DepositResponse;
import com.ecopoint.dto.RedeemRequest;
import com.ecopoint.dto.RedemptionResponse;
import com.ecopoint.entity.EcoWallet;
import com.ecopoint.entity.User;
import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.entity.WalletTransaction;
import com.ecopoint.service.AuthService;
import com.ecopoint.service.DepositService;
import com.ecopoint.service.RewardService;
import com.ecopoint.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final AuthService authService;
    private final DepositService depositService;
    private final WalletService walletService;
    private final RewardService rewardService;

    public UserController(AuthService authService, DepositService depositService, WalletService walletService, RewardService rewardService) {
        this.authService = authService;
        this.depositService = depositService;
        this.walletService = walletService;
        this.rewardService = rewardService;
    }

    private User getAuthenticatedUser(Principal principal) {
        return authService.getByEmail(principal.getName());
    }

    @PostMapping("/deposits")
    public ResponseEntity<DepositResponse> createDeposit(@Valid @RequestBody DepositRequest req, Principal principal) {
        User user = getAuthenticatedUser(principal);
        WasteDeposit deposit = depositService.createDeposit(user, req);
        return ResponseEntity.ok(depositService.toResponse(deposit));
    }

    @GetMapping("/deposits")
    public ResponseEntity<List<DepositResponse>> getMyDeposits(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(depositService.getUserDeposits(user));
    }

    @GetMapping("/deposits/{code}")
    public ResponseEntity<DepositResponse> getDepositDetails(@PathVariable String code) {
        return ResponseEntity.ok(depositService.getDepositByCode(code));
    }

    @GetMapping("/wallet")
    public ResponseEntity<EcoWallet> getMyWallet(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(walletService.getOrCreateWallet(user));
    }

    @GetMapping("/wallet/transactions")
    public ResponseEntity<List<WalletTransaction>> getMyTransactions(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(walletService.getTransactions(user));
    }

    @PostMapping("/rewards/redeem")
    public ResponseEntity<RedemptionResponse> redeemReward(@Valid @RequestBody RedeemRequest req, Principal principal) {
        User user = getAuthenticatedUser(principal);
        var redemption = rewardService.redeemReward(user, req.getRewardId());
        return ResponseEntity.ok(rewardService.toResponse(redemption));
    }

    @GetMapping("/rewards/my-redemptions")
    public ResponseEntity<List<RedemptionResponse>> getMyRedemptions(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(rewardService.getUserRedemptions(user));
    }
}
