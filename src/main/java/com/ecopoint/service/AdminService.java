package com.ecopoint.service;

import com.ecopoint.dto.DashboardStatsDto;
import com.ecopoint.entity.Bag;
import com.ecopoint.entity.WasteCategory;
import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.repository.*;
import org.springframework.stereotype.Service;

import com.ecopoint.dto.RegisterRequest;
import com.ecopoint.entity.EcoWallet;
import com.ecopoint.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class AdminService {

    private final WasteDepositRepository depositRepository;
    private final UserRepository userRepository;
    private final BagRepository bagRepository;
    private final WasteCategoryRepository categoryRepository;
    private final RewardRedemptionRepository redemptionRepository;
    private final EcoWalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            WasteDepositRepository depositRepository,
            UserRepository userRepository,
            BagRepository bagRepository,
            WasteCategoryRepository categoryRepository,
            RewardRedemptionRepository redemptionRepository,
            EcoWalletRepository walletRepository,
            PasswordEncoder passwordEncoder) {
        this.depositRepository = depositRepository;
        this.userRepository = userRepository;
        this.bagRepository = bagRepository;
        this.categoryRepository = categoryRepository;
        this.redemptionRepository = redemptionRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(RegisterRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String cleanEmail = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email is already registered: " + cleanEmail);
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        User.Role role = req.getRole() != null ? req.getRole() : User.Role.ROLE_USER;

        User user = new User(
            req.getFullName() != null && !req.getFullName().isBlank() ? req.getFullName().trim() : "Staff Member",
            cleanEmail,
            passwordEncoder.encode(req.getPassword()),
            req.getPhone() != null ? req.getPhone().trim() : "",
            role
        );
        user = userRepository.save(user);

        // Initialize wallet for new user
        walletRepository.save(new EcoWallet(user));

        return user;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();
        List<WasteDeposit> all = depositRepository.findAll();

        stats.setTotalDeposits(all.size());
        stats.setPendingPickupsCount(all.stream().filter(d -> d.getStatus() == WasteDeposit.Status.SUBMITTED).count());
        stats.setPendingVerificationsCount(all.stream().filter(d -> d.getStatus() == WasteDeposit.Status.PICKED_UP || d.getStatus() == WasteDeposit.Status.AT_FACILITY).count());
        stats.setVerifiedCount(all.stream().filter(d -> d.getStatus() == WasteDeposit.Status.VERIFIED).count());

        double totalWeight = all.stream()
                .filter(d -> d.getStatus() == WasteDeposit.Status.VERIFIED && d.getActualWeight() != null)
                .mapToDouble(WasteDeposit::getActualWeight)
                .sum();
        stats.setTotalWeightKg(Math.round(totalWeight * 100.0) / 100.0);

        long totalPoints = all.stream()
                .filter(d -> d.getStatus() == WasteDeposit.Status.VERIFIED && d.getPointsAwarded() != null)
                .mapToLong(WasteDeposit::getPointsAwarded)
                .sum();
        stats.setTotalPointsAwarded(totalPoints);

        stats.setActiveBagsCount(bagRepository.count());
        stats.setTotalUsersCount(userRepository.count());
        stats.setTotalRedemptionsCount(redemptionRepository.count());

        return stats;
    }

    public WasteCategory updateCategoryRate(Long categoryId, int pointsPerKg) {
        WasteCategory cat = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
        cat.setPointsPerKg(pointsPerKg);
        return categoryRepository.save(cat);
    }

    public Bag registerBag(String bagCode) {
        String clean = bagCode.trim().toUpperCase();
        if (bagRepository.existsByBagCode(clean)) {
            throw new IllegalArgumentException("Bag code already registered: " + clean);
        }
        Bag bag = new Bag(clean, null);
        return bagRepository.save(bag);
    }

    public List<Bag> getAllBags() {
        return bagRepository.findAll();
    }
}
