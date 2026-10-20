package com.ecopoint.service;

import com.ecopoint.dto.DepositRequest;
import com.ecopoint.dto.DepositResponse;
import com.ecopoint.dto.VerificationRequest;
import com.ecopoint.entity.*;
import com.ecopoint.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepositService {

    private final WasteDepositRepository depositRepository;
    private final DepositEventRepository eventRepository;
    private final BagRepository bagRepository;
    private final WasteCategoryRepository categoryRepository;
    private final WalletService walletService;
    private final SecureRandom random = new SecureRandom();

    public DepositService(
            WasteDepositRepository depositRepository,
            DepositEventRepository eventRepository,
            BagRepository bagRepository,
            WasteCategoryRepository categoryRepository,
            WalletService walletService) {
        this.depositRepository = depositRepository;
        this.eventRepository = eventRepository;
        this.bagRepository = bagRepository;
        this.categoryRepository = categoryRepository;
        this.walletService = walletService;
    }

    @Transactional
    public WasteDeposit createDeposit(User user, DepositRequest req) {
        String cleanBagCode = req.getBagCode().trim().toUpperCase();

        // 1. Find or auto-register bag
        Bag bag = bagRepository.findByBagCode(cleanBagCode).orElseGet(() -> {
            Bag newBag = new Bag(cleanBagCode, user);
            return bagRepository.save(newBag);
        });

        // 2. CONSTRAINT: One reusable bag cannot have multiple unresolved deposits!
        List<WasteDeposit.Status> activeStatuses = Arrays.asList(
            WasteDeposit.Status.SUBMITTED,
            WasteDeposit.Status.PICKED_UP,
            WasteDeposit.Status.AT_FACILITY
        );
        var activeDepositOpt = depositRepository.findFirstByBagAndStatusIn(bag, activeStatuses);
        if (activeDepositOpt.isPresent()) {
            throw new IllegalStateException("Bag " + cleanBagCode + " currently has an unresolved active deposit (" +
                    activeDepositOpt.get().getDepositCode() + " - " + activeDepositOpt.get().getStatus() +
                    "). It cannot be reused until verified at the facility.");
        }

        // 3. Find category
        WasteCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid waste category ID: " + req.getCategoryId()));

        // 4. Generate unique deposit code
        String depositCode = generateDepositCode();

        // 5. Create deposit
        WasteDeposit deposit = new WasteDeposit(depositCode, user, bag, category, req.getEstimatedWeight());
        deposit = depositRepository.save(deposit);

        // 6. Record audit event
        String note = "Deposit registered with estimated weight " + req.getEstimatedWeight() + " kg";
        if (req.getNotes() != null && !req.getNotes().isBlank()) {
            note += ". Note: " + req.getNotes().trim();
        }
        recordEvent(deposit, WasteDeposit.Status.SUBMITTED, user.getFullName(), "ROLE_USER", note);

        return deposit;
    }

    @Transactional
    public WasteDeposit confirmPickup(Long depositId, User collector, String collectorNotes) {
        WasteDeposit deposit = depositRepository.findById(depositId)
                .orElseThrow(() -> new IllegalArgumentException("Deposit not found: " + depositId));

        if (deposit.getStatus() != WasteDeposit.Status.SUBMITTED) {
            throw new IllegalStateException("Deposit " + deposit.getDepositCode() +
                    " cannot be picked up because its current status is " + deposit.getStatus());
        }

        deposit.setStatus(WasteDeposit.Status.PICKED_UP);
        deposit.setCollector(collector);
        deposit.setPickedUpAt(Instant.now());
        deposit = depositRepository.save(deposit);

        String note = "Bag verified and picked up by collector";
        if (collectorNotes != null && !collectorNotes.isBlank()) {
            note += ". " + collectorNotes.trim();
        }
        recordEvent(deposit, WasteDeposit.Status.PICKED_UP, collector.getFullName(), "ROLE_COLLECTOR", note);

        return deposit;
    }

    @Transactional
    public WasteDeposit markAtFacility(Long depositId, User operator, String notes) {
        WasteDeposit deposit = depositRepository.findById(depositId)
                .orElseThrow(() -> new IllegalArgumentException("Deposit not found: " + depositId));

        if (deposit.getStatus() != WasteDeposit.Status.PICKED_UP) {
            throw new IllegalStateException("Deposit must be in PICKED_UP status to record receipt at facility.");
        }

        deposit.setStatus(WasteDeposit.Status.AT_FACILITY);
        deposit.setFacilityOperator(operator);
        deposit = depositRepository.save(deposit);

        String note = "Bag received at recovery facility for weighing and grading";
        if (notes != null && !notes.isBlank()) {
            note += ". " + notes.trim();
        }
        recordEvent(deposit, WasteDeposit.Status.AT_FACILITY, operator.getFullName(), "ROLE_OPERATOR", note);

        return deposit;
    }

    @Transactional
    public WasteDeposit verifyDeposit(Long depositId, User operator, VerificationRequest req) {
        WasteDeposit deposit = depositRepository.findById(depositId)
                .orElseThrow(() -> new IllegalArgumentException("Deposit not found: " + depositId));

        // Enforce valid status transition
        if (deposit.getStatus() != WasteDeposit.Status.PICKED_UP && deposit.getStatus() != WasteDeposit.Status.AT_FACILITY) {
            throw new IllegalStateException("Deposit " + deposit.getDepositCode() +
                    " cannot be verified from status " + deposit.getStatus() + ". It must be picked up first.");
        }

        // Anti-fraud: prevent duplicate credit
        if (Boolean.TRUE.equals(deposit.getIsPointsCredited())) {
            throw new IllegalStateException("Deposit " + deposit.getDepositCode() + " has already been credited.");
        }

        WasteCategory actualCategory = categoryRepository.findById(req.getActualCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid accepted waste category ID: " + req.getActualCategoryId()));

        deposit.setFacilityOperator(operator);
        deposit.setActualCategory(actualCategory);
        deposit.setActualWeight(req.getActualWeight());
        deposit.setContaminationRate(0.0);
        deposit.setContaminationNotes(null);
        deposit.setVerifiedAt(Instant.now());

        if (req.isReject()) {
            deposit.setStatus(WasteDeposit.Status.REJECTED);
            deposit.setProcessingOutcome(WasteDeposit.Outcome.LANDFILL_REJECTED);
            deposit.setPointsAwarded(0);
            deposit.setIsPointsCredited(true);
            deposit = depositRepository.save(deposit);

            String note = "Deposit rejected during facility inspection. Reason: " +
                    (req.getOperatorNotes() != null && !req.getOperatorNotes().isBlank() ? req.getOperatorNotes() : "Material does not meet recycling standards");
            recordEvent(deposit, WasteDeposit.Status.REJECTED, operator.getFullName(), "ROLE_OPERATOR", note);
            return deposit;
        }

        // Calculate EcoPoints: basePoints = actualWeight * categoryRatePerKg
        int ratePerKg = actualCategory.getPointsPerKg();
        int finalPoints = (int) Math.round(req.getActualWeight() * ratePerKg);

        deposit.setStatus(WasteDeposit.Status.VERIFIED);
        deposit.setProcessingOutcome(req.getProcessingOutcome());
        deposit.setPointsAwarded(finalPoints);
        deposit.setIsPointsCredited(true);
        deposit = depositRepository.save(deposit);

        // Credit points to user's wallet and ledger
        walletService.creditPoints(
            deposit.getUser(),
            finalPoints,
            deposit,
            "EcoPoints awarded for deposit " + deposit.getDepositCode() +
            " (" + actualCategory.getName() + ", " + req.getActualWeight() + " kg)"
        );

        String note = "Verification complete. Accepted weight: " + req.getActualWeight() +
                " kg. Outcome: " + req.getProcessingOutcome() + ". " + finalPoints + " EcoPoints credited.";
        if (req.getOperatorNotes() != null && !req.getOperatorNotes().isBlank()) {
            note += " Details: " + req.getOperatorNotes().trim();
        }
        recordEvent(deposit, WasteDeposit.Status.VERIFIED, operator.getFullName(), "ROLE_OPERATOR", note);

        return deposit;
    }

    public List<DepositResponse> getUserDeposits(User user) {
        return depositRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DepositResponse> getPendingPickups() {
        return depositRepository.findByStatusOrderByCreatedAtAsc(WasteDeposit.Status.SUBMITTED).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DepositResponse> getIncomingToFacility() {
        List<WasteDeposit.Status> facilityStatuses = Arrays.asList(
            WasteDeposit.Status.PICKED_UP,
            WasteDeposit.Status.AT_FACILITY
        );
        return depositRepository.findByStatusInOrderByCreatedAtAsc(facilityStatuses).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DepositResponse> getAllDeposits() {
        return depositRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DepositResponse getDepositByCode(String code) {
        WasteDeposit deposit = depositRepository.findByDepositCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Deposit not found with code: " + code));
        return toResponse(deposit);
    }

    private void recordEvent(WasteDeposit deposit, WasteDeposit.Status status, String actorName, String actorRole, String note) {
        DepositEvent event = new DepositEvent(deposit, status, actorName, actorRole, note);
        eventRepository.save(event);
    }

    private String generateDepositCode() {
        int year = Year.now().getValue();
        int randNum = 1000 + random.nextInt(9000);
        return "DEP-" + year + "-" + randNum;
    }

    public DepositResponse toResponse(WasteDeposit d) {
        DepositResponse res = new DepositResponse();
        res.setId(d.getId());
        res.setDepositCode(d.getDepositCode());
        res.setUserId(d.getUser().getId());
        res.setUserFullName(d.getUser().getFullName());
        res.setUserEmail(d.getUser().getEmail());
        res.setBagCode(d.getBag().getBagCode());
        res.setInitialCategoryId(d.getInitialCategory().getId());
        res.setInitialCategoryName(d.getInitialCategory().getName());
        res.setEstimatedWeight(d.getEstimatedWeight());
        res.setStatus(d.getStatus());
        res.setCollectorName(d.getCollector() != null ? d.getCollector().getFullName() : null);
        res.setFacilityOperatorName(d.getFacilityOperator() != null ? d.getFacilityOperator().getFullName() : null);
        res.setActualCategoryId(d.getActualCategory() != null ? d.getActualCategory().getId() : null);
        res.setActualCategoryName(d.getActualCategory() != null ? d.getActualCategory().getName() : null);
        res.setActualWeight(d.getActualWeight());
        res.setContaminationRate(d.getContaminationRate());
        res.setContaminationNotes(d.getContaminationNotes());
        res.setProcessingOutcome(d.getProcessingOutcome());
        res.setPointsAwarded(d.getPointsAwarded());
        res.setIsPointsCredited(d.getIsPointsCredited());
        res.setCreatedAt(d.getCreatedAt());
        res.setPickedUpAt(d.getPickedUpAt());
        res.setVerifiedAt(d.getVerifiedAt());

        List<DepositEvent> events = eventRepository.findByDepositOrderByTimestampAsc(d);
        res.setTimeline(events.stream().map(e -> new DepositResponse.DepositEventDto(
            e.getId(),
            e.getStatus(),
            e.getActorName(),
            e.getActorRole(),
            e.getNote(),
            e.getTimestamp()
        )).collect(Collectors.toList()));

        return res;
    }
}
