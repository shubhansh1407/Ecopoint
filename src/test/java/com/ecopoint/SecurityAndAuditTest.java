package com.ecopoint;

import com.ecopoint.dto.DepositRequest;
import com.ecopoint.dto.RegisterRequest;
import com.ecopoint.dto.VerificationRequest;
import com.ecopoint.entity.Reward;
import com.ecopoint.entity.User;
import com.ecopoint.entity.WasteCategory;
import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.repository.RewardRepository;
import com.ecopoint.repository.UserRepository;
import com.ecopoint.repository.WasteCategoryRepository;
import com.ecopoint.repository.WasteDepositRepository;
import com.ecopoint.service.AdminService;
import com.ecopoint.service.AuthService;
import com.ecopoint.service.CsvExportService;
import com.ecopoint.service.DepositService;
import com.ecopoint.service.RewardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class SecurityAndAuditTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private DepositService depositService;

    @Autowired
    private RewardService rewardService;

    @Autowired
    private CsvExportService csvExportService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WasteCategoryRepository categoryRepository;

    @Autowired
    private WasteDepositRepository depositRepository;

    @Autowired
    private RewardRepository rewardRepository;

    private User testUser;
    private User testCollector;
    private User testOperator;
    private WasteCategory plasticCat;

    @BeforeEach
    void setup() {
        testUser = userRepository.findByEmail("user@ecopoint.com")
                .orElseGet(() -> userRepository.save(new User("Test User", "testaudituser@ecopoint.com", "hash", "123", User.Role.ROLE_USER)));

        testCollector = userRepository.findByEmail("collector@ecopoint.com")
                .orElseGet(() -> userRepository.save(new User("Test Collector", "testcollector@ecopoint.com", "hash", "123", User.Role.ROLE_COLLECTOR)));

        testOperator = userRepository.findByEmail("operator@ecopoint.com")
                .orElseGet(() -> userRepository.save(new User("Test Operator", "testoperator@ecopoint.com", "hash", "123", User.Role.ROLE_OPERATOR)));

        plasticCat = categoryRepository.findByName("PLASTIC")
                .orElseGet(() -> categoryRepository.save(new WasteCategory("PLASTIC", 10, "Plastic items")));
    }

    @Test
    @DisplayName("Security: Public registration MUST NOT allow escalation to ROLE_ADMIN")
    void testRegistrationCannotEscalatePrivileges() {
        RegisterRequest req = new RegisterRequest();
        req.setFullName("Attacker");
        req.setEmail("attacker@example.com");
        req.setPassword("Password123!");
        req.setRole(User.Role.ROLE_ADMIN); // Malicious attempt to self-assign admin

        User registered = authService.register(req);
        assertEquals(User.Role.ROLE_USER, registered.getRole(), "Registration must strictly assign ROLE_USER regardless of input");
    }

    @Test
    @DisplayName("Admin: Admin can successfully create Collector and Facility Operator accounts")
    void testAdminCanCreateCollectorAndOperatorAccounts() {
        RegisterRequest collectorReq = new RegisterRequest();
        collectorReq.setFullName("Admin Created Collector");
        collectorReq.setEmail("admincreatedcollector@ecopoint.com");
        collectorReq.setPassword("Password123!");
        collectorReq.setRole(User.Role.ROLE_COLLECTOR);

        User collector = adminService.createUser(collectorReq);
        assertEquals(User.Role.ROLE_COLLECTOR, collector.getRole());

        RegisterRequest operatorReq = new RegisterRequest();
        operatorReq.setFullName("Admin Created Operator");
        operatorReq.setEmail("admincreatedoperator@ecopoint.com");
        operatorReq.setPassword("Password123!");
        operatorReq.setRole(User.Role.ROLE_OPERATOR);

        User operator = adminService.createUser(operatorReq);
        assertEquals(User.Role.ROLE_OPERATOR, operator.getRole());
    }

    @Test
    @DisplayName("Deposit: Rejects negative or zero estimated weight upon submission")
    void testDepositRejectsInvalidEstimatedWeight() {
        DepositRequest req = new DepositRequest();
        req.setBagCode("BAG-ZERO-WT");
        req.setCategoryId(plasticCat.getId());
        req.setEstimatedWeight(0.0);

        assertThrows(IllegalArgumentException.class, () -> {
            depositService.createDeposit(testUser, req);
        });

        req.setEstimatedWeight(-2.5);
        assertThrows(IllegalArgumentException.class, () -> {
            depositService.createDeposit(testUser, req);
        });
    }

    @Test
    @DisplayName("Deposit: Verification rejects negative or zero actual weight")
    void testVerificationRejectsInvalidActualWeight() {
        DepositRequest req = new DepositRequest();
        req.setBagCode("BAG-VERIF-WT");
        req.setCategoryId(plasticCat.getId());
        req.setEstimatedWeight(1.5);

        WasteDeposit deposit = depositService.createDeposit(testUser, req);
        depositService.confirmPickup(deposit.getId(), testCollector, "Pickup verified");

        VerificationRequest vReq = new VerificationRequest();
        vReq.setActualCategoryId(plasticCat.getId());
        vReq.setActualWeight(0.0);
        vReq.setProcessingOutcome(WasteDeposit.Outcome.RECYCLED);
        vReq.setReject(false);

        assertThrows(IllegalArgumentException.class, () -> {
            depositService.verifyDeposit(deposit.getId(), testOperator, vReq);
        });
    }

    @Test
    @DisplayName("Rewards: Rejects redemption when stock is 0 (Out of stock)")
    void testRedemptionRejectionWhenOutOfStock() {
        Reward zeroStockReward = rewardRepository.save(new Reward(
                "Out of Stock Item",
                "Description",
                Reward.Category.ECO_PRODUCT,
                10,
                0, // 0 stock
                "EcoPartner"
        ));

        assertThrows(IllegalStateException.class, () -> {
            rewardService.redeemReward(testUser, zeroStockReward.getId());
        });
    }

    @Test
    @DisplayName("CSV Export: Exports successfully with null/pending outcome without NullPointerException")
    void testCsvExportWithUnverifiedDeposit() {
        DepositRequest req = new DepositRequest();
        req.setBagCode("BAG-CSV-PENDING");
        req.setCategoryId(plasticCat.getId());
        req.setEstimatedWeight(2.0);

        WasteDeposit deposit = depositService.createDeposit(testUser, req);
        assertEquals(WasteDeposit.Outcome.PENDING, deposit.getProcessingOutcome());

        // Test with default PENDING outcome
        byte[] csvBytes = csvExportService.exportDepositsToCsv(java.util.List.of(deposit));
        assertNotNull(csvBytes);
        String csvContent = new String(csvBytes);
        assertTrue(csvContent.contains("PENDING"));
        assertTrue(csvContent.contains("BAG-CSV-PENDING"));

        // Explicitly test null safety if a record has null processingOutcome or null dates
        deposit.setProcessingOutcome(null);
        deposit.setUser(null);
        assertDoesNotThrow(() -> {
            byte[] nullSafeCsv = csvExportService.exportDepositsToCsv(java.util.List.of(deposit));
            assertNotNull(nullSafeCsv);
            assertTrue(new String(nullSafeCsv).contains("PENDING"));
        });
    }
}
