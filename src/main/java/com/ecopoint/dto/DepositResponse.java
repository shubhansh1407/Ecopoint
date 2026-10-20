package com.ecopoint.dto;

import com.ecopoint.entity.WasteDeposit;
import java.time.Instant;
import java.util.List;

public class DepositResponse {
    private Long id;
    private String depositCode;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String bagCode;
    private Long initialCategoryId;
    private String initialCategoryName;
    private Double estimatedWeight;
    private WasteDeposit.Status status;
    private String collectorName;
    private String facilityOperatorName;
    private Long actualCategoryId;
    private String actualCategoryName;
    private Double actualWeight;
    private Double contaminationRate;
    private String contaminationNotes;
    private WasteDeposit.Outcome processingOutcome;
    private Integer pointsAwarded;
    private Boolean isPointsCredited;
    private Instant createdAt;
    private Instant pickedUpAt;
    private Instant verifiedAt;
    private List<DepositEventDto> timeline;

    public static class DepositEventDto {
        private Long id;
        private WasteDeposit.Status status;
        private String actorName;
        private String actorRole;
        private String note;
        private Instant timestamp;

        public DepositEventDto() {}

        public DepositEventDto(Long id, WasteDeposit.Status status, String actorName, String actorRole, String note, Instant timestamp) {
            this.id = id;
            this.status = status;
            this.actorName = actorName;
            this.actorRole = actorRole;
            this.note = note;
            this.timestamp = timestamp;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public WasteDeposit.Status getStatus() { return status; }
        public void setStatus(WasteDeposit.Status status) { this.status = status; }
        public String getActorName() { return actorName; }
        public void setActorName(String actorName) { this.actorName = actorName; }
        public String getActorRole() { return actorRole; }
        public void setActorRole(String actorRole) { this.actorRole = actorRole; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    public DepositResponse() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDepositCode() { return depositCode; }
    public void setDepositCode(String depositCode) { this.depositCode = depositCode; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getBagCode() { return bagCode; }
    public void setBagCode(String bagCode) { this.bagCode = bagCode; }
    public Long getInitialCategoryId() { return initialCategoryId; }
    public void setInitialCategoryId(Long initialCategoryId) { this.initialCategoryId = initialCategoryId; }
    public String getInitialCategoryName() { return initialCategoryName; }
    public void setInitialCategoryName(String initialCategoryName) { this.initialCategoryName = initialCategoryName; }
    public Double getEstimatedWeight() { return estimatedWeight; }
    public void setEstimatedWeight(Double estimatedWeight) { this.estimatedWeight = estimatedWeight; }
    public WasteDeposit.Status getStatus() { return status; }
    public void setStatus(WasteDeposit.Status status) { this.status = status; }
    public String getCollectorName() { return collectorName; }
    public void setCollectorName(String collectorName) { this.collectorName = collectorName; }
    public String getFacilityOperatorName() { return facilityOperatorName; }
    public void setFacilityOperatorName(String facilityOperatorName) { this.facilityOperatorName = facilityOperatorName; }
    public Long getActualCategoryId() { return actualCategoryId; }
    public void setActualCategoryId(Long actualCategoryId) { this.actualCategoryId = actualCategoryId; }
    public String getActualCategoryName() { return actualCategoryName; }
    public void setActualCategoryName(String actualCategoryName) { this.actualCategoryName = actualCategoryName; }
    public Double getActualWeight() { return actualWeight; }
    public void setActualWeight(Double actualWeight) { this.actualWeight = actualWeight; }
    public Double getContaminationRate() { return contaminationRate; }
    public void setContaminationRate(Double contaminationRate) { this.contaminationRate = contaminationRate; }
    public String getContaminationNotes() { return contaminationNotes; }
    public void setContaminationNotes(String contaminationNotes) { this.contaminationNotes = contaminationNotes; }
    public WasteDeposit.Outcome getProcessingOutcome() { return processingOutcome; }
    public void setProcessingOutcome(WasteDeposit.Outcome processingOutcome) { this.processingOutcome = processingOutcome; }
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
    public List<DepositEventDto> getTimeline() { return timeline; }
    public void setTimeline(List<DepositEventDto> timeline) { this.timeline = timeline; }
}
