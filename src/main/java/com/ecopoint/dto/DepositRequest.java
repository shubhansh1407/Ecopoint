package com.ecopoint.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DepositRequest {
    @NotBlank(message = "Reusable bag code is required")
    private String bagCode;

    @NotNull(message = "Waste category is required")
    private Long categoryId;

    @NotNull(message = "Estimated weight is required")
    @DecimalMin(value = "0.05", message = "Estimated weight must be at least 0.05 kg")
    private Double estimatedWeight;

    private String notes;

    public String getBagCode() { return bagCode; }
    public void setBagCode(String bagCode) { this.bagCode = bagCode; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public Double getEstimatedWeight() { return estimatedWeight; }
    public void setEstimatedWeight(Double estimatedWeight) { this.estimatedWeight = estimatedWeight; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
