package com.ecopoint;

import com.ecopoint.dto.DepositRequest;
import com.ecopoint.dto.VerificationRequest;
import com.ecopoint.entity.*;
import com.ecopoint.repository.*;
import com.ecopoint.service.DepositService;
import com.ecopoint.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class DepositWorkflowTest {

    @Autowired
    private DepositService depositService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WasteCategoryRepository categoryRepository;

    @Autowired
    private BagRepository bagRepository;

    @Autowired
    private WasteDepositRepository depositRepository;

    @Autowired
    private EcoWalletRepository walletRepository;

    private User testUser;
    private User testCollector;
    private User testOperator;
    private WasteCategory plasticCat;

    @BeforeEach
    void setup() {
        testUser = userRepository.findByEmail("user@ecopoint.com")
                .orElseGet(() -> userRepository.save(new User("Test User", "testuser@ecopoint.com", "hash", "123", User.Role.ROLE_USER)));

        testCollector = userRepository.findByEmail("collector@ecopoint.com")
                .orElseGet(() -> userRepository.save(new User("Test Collector", "testcollector@ecopoint.com", "hash", "123", User.Role.ROLE_COLLECTOR)));

        testOperator = userRepository.findByEmail("operator@ecopoint.com")
                .orElseGet(() -> userRepository.save(new User("Test Operator", "testoperator@ecopoint.com", "hash", "123", User.Role.ROLE_OPERATOR)));

        plasticCat = categoryRepository.findByName("PLASTIC")
                .orElseGet(() -> categoryRepository.save(new WasteCategory("PLASTIC", 10, "Plastic items")));
    }

    @Test
    @DisplayName("Complete Traceability Workflow: Submission -> Pickup -> Verification -> Points Credited")
    void testCompleteTraceabilityAndPointsCredit() {
        String bagCode = "BAG-TEST-99";

        // 1. User registers deposit
        DepositRequest req = new DepositRequest();
        req.setBagCode(bagCode);
        req.setCategoryId(plasticCat.getId());
        req.setEstimatedWeight(3.0);
        req.setNotes("Clean bottles");

        WasteDeposit deposit = depositService.createDeposit(testUser, req);
        assertNotNull(deposit.getId());
        assertTrue(deposit.getDepositCode().startsWith("DEP-"));
        assertEquals(WasteDeposit.Status.SUBMITTED, deposit.getStatus());
        assertEquals(3.0, deposit.getEstimatedWeight());

        // 2. Anti-fraud constraint: Reusing the same bag code while unresolved must throw IllegalStateException
        DepositRequest duplicateReq = new DepositRequest();
        duplicateReq.setBagCode(bagCode);
        duplicateReq.setCategoryId(plasticCat.getId());
        duplicateReq.setEstimatedWeight(1.0);

        assertThrows(IllegalStateException.class, () -> {
            depositService.createDeposit(testUser, duplicateReq);
        }, "Bag should not allow a second active deposit before resolution");

        // 3. Collector confirms pickup
        WasteDeposit pickedUp = depositService.confirmPickup(deposit.getId(), testCollector, "Pickup verified");
        assertEquals(WasteDeposit.Status.PICKED_UP, pickedUp.getStatus());
        assertEquals(testCollector.getId(), pickedUp.getCollector().getId());
        assertNotNull(pickedUp.getPickedUpAt());

        // 4. Facility operator verifies and weighs deposit
        // Actual weight: 4.0 kg. Rate: 10 pts/kg. Final = 4.0 * 10 = 40 pts.
        int initialBalance = walletService.getOrCreateWallet(testUser).getBalance();

        VerificationRequest vReq = new VerificationRequest();
        vReq.setActualCategoryId(plasticCat.getId());
        vReq.setActualWeight(4.0);
        vReq.setProcessingOutcome(WasteDeposit.Outcome.RECYCLED);
        vReq.setReject(false);

        WasteDeposit verified = depositService.verifyDeposit(deposit.getId(), testOperator, vReq);
        assertEquals(WasteDeposit.Status.VERIFIED, verified.getStatus());
        assertEquals(40, verified.getPointsAwarded());
        assertTrue(verified.getIsPointsCredited());

        // 5. Verify wallet points increased by exactly 40 points
        int newBalance = walletService.getOrCreateWallet(testUser).getBalance();
        assertEquals(initialBalance + 40, newBalance);

        // 6. Anti-fraud constraint: Double credit must be prevented
        assertThrows(IllegalStateException.class, () -> {
            depositService.verifyDeposit(deposit.getId(), testOperator, vReq);
        }, "Should prevent duplicate verification and credit");

        // 7. Now that the deposit is VERIFIED, the bag is free to be used again!
        DepositRequest newDepReq = new DepositRequest();
        newDepReq.setBagCode(bagCode);
        newDepReq.setCategoryId(plasticCat.getId());
        newDepReq.setEstimatedWeight(2.0);

        assertDoesNotThrow(() -> {
            WasteDeposit newDep = depositService.createDeposit(testUser, newDepReq);
            assertNotNull(newDep.getId());
        });
    }
}
