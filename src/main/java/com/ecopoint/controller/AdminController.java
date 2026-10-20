package com.ecopoint.controller;

import com.ecopoint.dto.DashboardStatsDto;
import com.ecopoint.dto.DepositResponse;
import com.ecopoint.dto.RegisterRequest;
import com.ecopoint.dto.UserResponse;
import com.ecopoint.entity.*;
import com.ecopoint.repository.UserRepository;
import com.ecopoint.repository.WasteCategoryRepository;
import com.ecopoint.repository.WasteDepositRepository;
import com.ecopoint.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final DepositService depositService;
    private final WasteDepositRepository depositRepository;
    private final UserRepository userRepository;
    private final WasteCategoryRepository categoryRepository;
    private final RewardService rewardService;
    private final WalletService walletService;
    private final CsvExportService csvExportService;
    private final AuthService authService;

    public AdminController(
            AdminService adminService,
            DepositService depositService,
            WasteDepositRepository depositRepository,
            UserRepository userRepository,
            WasteCategoryRepository categoryRepository,
            RewardService rewardService,
            WalletService walletService,
            CsvExportService csvExportService,
            AuthService authService) {
        this.adminService = adminService;
        this.depositService = depositService;
        this.depositRepository = depositRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.rewardService = rewardService;
        this.walletService = walletService;
        this.csvExportService = csvExportService;
        this.authService = authService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/deposits")
    public ResponseEntity<List<DepositResponse>> getAllDeposits() {
        return ResponseEntity.ok(depositService.getAllDeposits());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> list = userRepository.findAll().stream()
                .map(authService::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody RegisterRequest req) {
        User created = adminService.createUser(req);
        return ResponseEntity.ok(authService.toUserResponse(created));
    }

    @GetMapping("/bags")
    public ResponseEntity<List<Bag>> getAllBags() {
        return ResponseEntity.ok(adminService.getAllBags());
    }

    @PostMapping("/bags")
    public ResponseEntity<Bag> registerBag(@RequestBody Map<String, String> body) {
        String code = body.get("bagCode");
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Bag code is required");
        }
        return ResponseEntity.ok(adminService.registerBag(code));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<WasteCategory>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PutMapping("/categories/{id}/rate")
    public ResponseEntity<WasteCategory> updateRate(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer rate = body.get("pointsPerKg");
        if (rate == null || rate < 1) {
            throw new IllegalArgumentException("pointsPerKg must be at least 1");
        }
        return ResponseEntity.ok(adminService.updateCategoryRate(id, rate));
    }

    @GetMapping("/rewards")
    public ResponseEntity<List<Reward>> getAllRewards() {
        return ResponseEntity.ok(rewardService.getAllRewards());
    }

    @PostMapping("/rewards")
    public ResponseEntity<Reward> createReward(@Valid @RequestBody Reward reward) {
        return ResponseEntity.ok(rewardService.saveReward(reward));
    }

    @PutMapping("/rewards/{id}")
    public ResponseEntity<Reward> updateReward(@PathVariable Long id, @Valid @RequestBody Reward reward) {
        reward.setId(id);
        return ResponseEntity.ok(rewardService.saveReward(reward));
    }

    @GetMapping("/ledger")
    public ResponseEntity<List<WalletTransaction>> getLedger() {
        return ResponseEntity.ok(walletService.getAllTransactions());
    }

    @GetMapping("/reports/deposits/csv")
    public ResponseEntity<byte[]> exportDepositsCsv() {
        List<WasteDeposit> deposits = depositRepository.findAllByOrderByCreatedAtDesc();
        byte[] csv = csvExportService.exportDepositsToCsv(deposits);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ecopoint_deposits.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/reports/ledger/csv")
    public ResponseEntity<byte[]> exportLedgerCsv() {
        List<WalletTransaction> transactions = walletService.getAllTransactions();
        byte[] csv = csvExportService.exportLedgerToCsv(transactions);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ecopoints_ledger.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
