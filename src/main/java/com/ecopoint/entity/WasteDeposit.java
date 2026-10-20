package com.ecopoint.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

@Entity
@Table(name = "waste_deposits", indexes = {
    @Index(name = "idx_deposit_code", columnList = "depositCode", unique = true),
    @Index(name = "idx_deposit_status", columnList = "status"),
    @Index(name = "idx_deposit_bag", columnList = "bag_id")
})
public class WasteDeposit {

    public enum Status {
        SUBMITTED,
        PICKED_UP,
        AT_FACILITY,
        VERIFIED,
        REJECTED
    }

    public enum Outcome {
        PENDING,
        RECYCLED,
        COMPOSTED,
        ENERGY_RECOVERY,
        HAZARDOUS_DISPOSAL,
        LANDFILL_REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 32)
    private String depositCode;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bag_id", nullable = false)
    private Bag bag;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "initial_category_id", nullable = false)
    private WasteCategory initialCategory;

    @NotNull
    @DecimalMin("0.05")
    @Column(nullable = false)
    private Double estimatedWeight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.SUBMITTED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collector_id")
    private User collector;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_operator_id")
    private User facilityOperator;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "actual_category_id")
    private WasteCategory actualCategory;

    private Double actualWeight;

    private Double contaminationRate = 0.0; // 0 to 100%

    @Column(length = 500)
    private String contaminationNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Outcome processingOutcome = Outcome.PENDING;

    @Column(nullable = false)
    private Integer pointsAwarded = 0;

    @Column(nullable = false)
    private Boolean isPointsCredited = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant pickedUpAt;

    private Instant verifiedAt;

    public WasteDeposit() {}

    public WasteDeposit(String depositCode, User user, Bag bag, WasteCategory initialCategory, Double estimatedWeight) {
        this.depositCode = depositCode;
        this.user = user;
        this.bag = bag;
        this.initialCategory = initialCategory;
        this.estimatedWeight = estimatedWeight;
        this.status = Status.SUBMITTED;
        this.processingOutcome = Outcome.PENDING;
        this.pointsAwarded = 0;
        this.isPointsCredited = false;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDepositCode() { return depositCode; }
    public void setDepositCode(String depositCode) { this.depositCode = depositCode; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Bag getBag() { return bag; }
    public void setBag(Bag bag) { this.bag = bag; }

    public WasteCategory getInitialCategory() { return initialCategory; }
    public void setInitialCategory(WasteCategory initialCategory) { this.initialCategory = initialCategory; }

    public Double getEstimatedWeight() { return estimatedWeight; }
    public void setEstimatedWeight(Double estimatedWeight) { this.estimatedWeight = estimatedWeight; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public User getCollector() { return collector; }
    public void setCollector(User collector) { this.collector = collector; }

    public User getFacilityOperator() { return facilityOperator; }
    public void setFacilityOperator(User facilityOperator) { this.facilityOperator = facilityOperator; }

    public WasteCategory getActualCategory() { return actualCategory; }
    public void setActualCategory(WasteCategory actualCategory) { this.actualCategory = actualCategory; }

    public Double getActualWeight() { return actualWeight; }
    public void setActualWeight(Double actualWeight) { this.actualWeight = actualWeight; }

    public Double getContaminationRate() { return contaminationRate; }
    public void setContaminationRate(Double contaminationRate) { this.contaminationRate = contaminationRate; }

    public String getContaminationNotes() { return contaminationNotes; }
    public void setContaminationNotes(String contaminationNotes) { this.contaminationNotes = contaminationNotes; }

    public Outcome getProcessingOutcome() { return processingOutcome; }
    public void setProcessingOutcome(Outcome processingOutcome) { this.processingOutcome = processingOutcome; }

    public Integer getPointsAwarded() { return pointsAwarded; }
    public void setPointsAwarded(Integer pointsAwarded) { this.pointsAwarded = pointsAwarded; }

    public Boolean getIsPointsCredited() { return isPointsCredited; }
    public void setIsPointsCredited(Boolean isPointsCredited) { this.isPointsCredited = isPointsCredited; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(Instant pickedUpAt) { this.pickedUpAt = pickedUpAt; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
}
