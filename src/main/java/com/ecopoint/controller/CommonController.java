package com.ecopoint.controller;

import com.ecopoint.entity.Reward;
import com.ecopoint.entity.WasteCategory;
import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.repository.WasteCategoryRepository;
import com.ecopoint.service.RewardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/common")
public class CommonController {

    private final WasteCategoryRepository categoryRepository;
    private final RewardService rewardService;

    public CommonController(WasteCategoryRepository categoryRepository, RewardService rewardService) {
        this.categoryRepository = categoryRepository;
        this.rewardService = rewardService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<WasteCategory>> getActiveCategories() {
        return ResponseEntity.ok(categoryRepository.findByActiveTrue());
    }

    @GetMapping("/rewards")
    public ResponseEntity<List<Reward>> getActiveRewards() {
        return ResponseEntity.ok(rewardService.getActiveRewards());
    }

    @GetMapping("/outcomes")
    public ResponseEntity<List<String>> getProcessingOutcomes() {
        return ResponseEntity.ok(Arrays.stream(WasteDeposit.Outcome.values())
                .map(Enum::name)
                .collect(Collectors.toList()));
    }

    @GetMapping("/demo-users")
    public ResponseEntity<List<Map<String, String>>> getDemoUsers() {
        return ResponseEntity.ok(List.of(
            Map.of("role", "Citizen User", "email", "user@ecopoint.com", "badge", "USER"),
            Map.of("role", "Waste Collector", "email", "collector@ecopoint.com", "badge", "COLLECTOR"),
            Map.of("role", "Facility Operator", "email", "operator@ecopoint.com", "badge", "OPERATOR"),
            Map.of("role", "Platform Admin", "email", "admin@ecopoint.com", "badge", "ADMIN")
        ));
    }
}
