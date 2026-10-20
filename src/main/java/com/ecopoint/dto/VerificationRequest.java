package com.ecopoint.dto;

import com.ecopoint.entity.WasteDeposit;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class VerificationRequest {
    @NotNull(message = "Accepted waste category is required")
    private Long actualCategoryId;

    @NotNull(message = "Actual measured weight is required")
    @DecimalMin(value = "0.01", message = "Actual weight must be at least 0.01 kg")
    private Double actualWeight;

    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Double contaminationRate = 0.0;

    private String contaminationNotes;

    @NotNull(message = "Processing outcome is required")
    private WasteDeposit.Outcome processingOutcome = WasteDeposit.Outcome.RECYCLED;

    private String operatorNotes;

    private boolean reject = false;

    public Long getActualCategoryId() { return actualCategoryId; }
    public void setActualCategoryId(Long actualCategoryId) { this.actualCategoryId = actualCategoryId; }

    public Double getActualWeight() { return actualWeight; }
    public void setActualWeight(Double actualWeight) { this.actualWeight = actualWeight; }

    public Double getContaminationRate() { return contaminationRate; }
    public void setContaminationRate(Double contaminationRate) { this.contaminationRate = contaminationRate; }

    public String getContaminationNotes() { return contaminationNotes; }
    public void setContaminationNotes(String contaminationNotes) { this.contaminationNotes = contaminationNotes; }

    public WasteDeposit.Outcome getProcessingOutcome() { return processingOutcome; }
    public void setProcessingOutcome(WasteDeposit.Outcome processingOutcome) { this.processingOutcome = processingOutcome; }

    public String getOperatorNotes() { return operatorNotes; }
    public void setOperatorNotes(String operatorNotes) { this.operatorNotes = operatorNotes; }

    public boolean isReject() { return reject; }
    public void setReject(boolean reject) { this.reject = reject; }
}
