package com.ecopoint.dto;

import com.ecopoint.entity.Reward;
import com.ecopoint.entity.RewardRedemption;
import java.time.Instant;

public class RedemptionResponse {
    private Long id;
    private Long rewardId;
    private String rewardTitle;
    private Reward.Category rewardCategory;
    private String sponsorName;
    private Integer pointsSpent;
    private String redemptionCode;
    private RewardRedemption.Status status;
    private Instant redeemedAt;
    private Instant expiresAt;

    public RedemptionResponse() {}

    public RedemptionResponse(Long id, Long rewardId, String rewardTitle, Reward.Category rewardCategory, String sponsorName, Integer pointsSpent, String redemptionCode, RewardRedemption.Status status, Instant redeemedAt, Instant expiresAt) {
        this.id = id;
        this.rewardId = rewardId;
        this.rewardTitle = rewardTitle;
        this.rewardCategory = rewardCategory;
        this.sponsorName = sponsorName;
        this.pointsSpent = pointsSpent;
        this.redemptionCode = redemptionCode;
        this.status = status;
        this.redeemedAt = redeemedAt;
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRewardId() { return rewardId; }
    public void setRewardId(Long rewardId) { this.rewardId = rewardId; }
    public String getRewardTitle() { return rewardTitle; }
    public void setRewardTitle(String rewardTitle) { this.rewardTitle = rewardTitle; }
    public Reward.Category getRewardCategory() { return rewardCategory; }
    public void setRewardCategory(Reward.Category rewardCategory) { this.rewardCategory = rewardCategory; }
    public String getSponsorName() { return sponsorName; }
    public void setSponsorName(String sponsorName) { this.sponsorName = sponsorName; }
    public Integer getPointsSpent() { return pointsSpent; }
    public void setPointsSpent(Integer pointsSpent) { this.pointsSpent = pointsSpent; }
    public String getRedemptionCode() { return redemptionCode; }
    public void setRedemptionCode(String redemptionCode) { this.redemptionCode = redemptionCode; }
    public RewardRedemption.Status getStatus() { return status; }
    public void setStatus(RewardRedemption.Status status) { this.status = status; }
    public Instant getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(Instant redeemedAt) { this.redeemedAt = redeemedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
