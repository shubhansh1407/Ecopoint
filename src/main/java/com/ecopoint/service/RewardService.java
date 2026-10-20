package com.ecopoint.service;

import com.ecopoint.dto.RedemptionResponse;
import com.ecopoint.entity.Reward;
import com.ecopoint.entity.RewardRedemption;
import com.ecopoint.entity.User;
import com.ecopoint.repository.RewardRedemptionRepository;
import com.ecopoint.repository.RewardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RewardService {

    private final RewardRepository rewardRepository;
    private final RewardRedemptionRepository redemptionRepository;
    private final WalletService walletService;
    private final SecureRandom random = new SecureRandom();

    public RewardService(
            RewardRepository rewardRepository,
            RewardRedemptionRepository redemptionRepository,
            WalletService walletService) {
        this.rewardRepository = rewardRepository;
        this.redemptionRepository = redemptionRepository;
        this.walletService = walletService;
    }

    public List<Reward> getActiveRewards() {
        return rewardRepository.findByActiveTrueOrderByPointsCostAsc();
    }

    public List<Reward> getAllRewards() {
        return rewardRepository.findAll();
    }

    @Transactional
    public RewardRedemption redeemReward(User user, Long rewardId) {
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new IllegalArgumentException("Reward not found: " + rewardId));

        if (!reward.isActive()) {
            throw new IllegalStateException("This reward is currently unavailable.");
        }

        if (reward.getStock() <= 0) {
            throw new IllegalStateException("Reward '" + reward.getTitle() + "' is out of stock.");
        }

        // Deduct points from wallet and record ledger entry
        walletService.debitPoints(user, reward.getPointsCost(), "Redeemed reward: " + reward.getTitle());

        // Decrement stock
        reward.setStock(reward.getStock() - 1);
        rewardRepository.save(reward);

        // Generate unique 16-character alphanumeric redemption voucher code
        String code = generateRedemptionCode();
        Instant expiresAt = Instant.now().plus(30, ChronoUnit.DAYS);

        RewardRedemption redemption = new RewardRedemption(user, reward, reward.getPointsCost(), code, expiresAt);
        return redemptionRepository.save(redemption);
    }

    public List<RedemptionResponse> getUserRedemptions(User user) {
        return redemptionRepository.findByUserOrderByRedeemedAtDesc(user).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<RedemptionResponse> getAllRedemptions() {
        return redemptionRepository.findAllByOrderByRedeemedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public Reward saveReward(Reward reward) {
        return rewardRepository.save(reward);
    }

    private String generateRedemptionCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder("ECO-");
        for (int i = 0; i < 4; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        sb.append("-");
        for (int i = 0; i < 4; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public RedemptionResponse toResponse(RewardRedemption r) {
        return new RedemptionResponse(
            r.getId(),
            r.getReward().getId(),
            r.getReward().getTitle(),
            r.getReward().getCategory(),
            r.getReward().getSponsorName(),
            r.getPointsSpent(),
            r.getRedemptionCode(),
            r.getStatus(),
            r.getRedeemedAt(),
            r.getExpiresAt()
        );
    }
}
