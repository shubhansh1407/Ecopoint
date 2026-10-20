package com.ecopoint;

import com.ecopoint.entity.Reward;
import com.ecopoint.entity.RewardRedemption;
import com.ecopoint.entity.User;
import com.ecopoint.repository.RewardRepository;
import com.ecopoint.repository.UserRepository;
import com.ecopoint.service.RewardService;
import com.ecopoint.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class RewardRedemptionTest {

    @Autowired
    private RewardService rewardService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RewardRepository rewardRepository;

    private User testUser;
    private Reward testReward;

    @BeforeEach
    void setup() {
        testUser = userRepository.findByEmail("user@ecopoint.com")
                .orElseGet(() -> userRepository.save(new User("Test User", "testuser@ecopoint.com", "hash", "123", User.Role.ROLE_USER)));

        testReward = rewardRepository.save(new Reward(
            "Test Grocery Voucher",
            "Simulated ₹50 store discount",
            Reward.Category.VOUCHER,
            50,
            5,
            "Local Store (Simulated)"
        ));
    }

    @Test
    @DisplayName("Reward Redemption: Deducts Balance, Decrements Stock, and Generates Unique Code")
    void testRewardRedemption() {
        // Ensure user has at least 100 points
        walletService.creditPoints(testUser, 100, null, "Test seed points");

        int initialBalance = walletService.getOrCreateWallet(testUser).getBalance();
        int initialStock = testReward.getStock();

        // Redeem
        RewardRedemption redemption = rewardService.redeemReward(testUser, testReward.getId());

        assertNotNull(redemption.getId());
        assertNotNull(redemption.getRedemptionCode());
        assertTrue(redemption.getRedemptionCode().startsWith("ECO-"));
        assertEquals(50, redemption.getPointsSpent());
        assertEquals(RewardRedemption.Status.ISSUED, redemption.getStatus());

        // Balance must be decreased by 50
        int newBalance = walletService.getOrCreateWallet(testUser).getBalance();
        assertEquals(initialBalance - 50, newBalance);

        // Stock must be decreased by 1
        Reward updatedReward = rewardRepository.findById(testReward.getId()).orElseThrow();
        assertEquals(initialStock - 1, updatedReward.getStock());
    }

    @Test
    @DisplayName("Reward Redemption Rejection: Fails when user balance is insufficient")
    void testInsufficientPointsRedemption() {
        // Create user with 0 points
        User brokeUser = userRepository.save(new User("Broke User", "broke@ecopoint.com", "hash", "123", User.Role.ROLE_USER));

        assertThrows(IllegalStateException.class, () -> {
            rewardService.redeemReward(brokeUser, testReward.getId());
        });
    }
}
