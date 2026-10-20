package com.ecopoint.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reward_redemptions", indexes = {
    @Index(name = "idx_redemption_code", columnList = "redemptionCode", unique = true),
    @Index(name = "idx_redemption_user", columnList = "user_id")
})
public class RewardRedemption {

    public enum Status {
        ISSUED,
        USED,
        EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @Column(nullable = false)
    private Integer pointsSpent;

    @Column(unique = true, nullable = false, length = 32)
    private String redemptionCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ISSUED;

    @Column(nullable = false, updatable = false)
    private Instant redeemedAt = Instant.now();

    private Instant expiresAt;

    public RewardRedemption() {}

    public RewardRedemption(User user, Reward reward, Integer pointsSpent, String redemptionCode, Instant expiresAt) {
        this.user = user;
        this.reward = reward;
        this.pointsSpent = pointsSpent;
        this.redemptionCode = redemptionCode;
        this.status = Status.ISSUED;
        this.redeemedAt = Instant.now();
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Reward getReward() { return reward; }
    public void setReward(Reward reward) { this.reward = reward; }

    public Integer getPointsSpent() { return pointsSpent; }
    public void setPointsSpent(Integer pointsSpent) { this.pointsSpent = pointsSpent; }

    public String getRedemptionCode() { return redemptionCode; }
    public void setRedemptionCode(String redemptionCode) { this.redemptionCode = redemptionCode; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Instant getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(Instant redeemedAt) { this.redeemedAt = redeemedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
