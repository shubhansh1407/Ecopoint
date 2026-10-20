package com.ecopoint.dto;

public class DashboardStatsDto {
    private long totalDeposits;
    private double totalWeightKg;
    private long totalPointsAwarded;
    private long activeBagsCount;
    private long pendingPickupsCount;
    private long pendingVerificationsCount;
    private long verifiedCount;
    private long totalUsersCount;
    private long totalRedemptionsCount;
    public DashboardStatsDto() {}

    public long getTotalDeposits() { return totalDeposits; }
    public void setTotalDeposits(long totalDeposits) { this.totalDeposits = totalDeposits; }
    public double getTotalWeightKg() { return totalWeightKg; }
    public void setTotalWeightKg(double totalWeightKg) { this.totalWeightKg = totalWeightKg; }
    public long getTotalPointsAwarded() { return totalPointsAwarded; }
    public void setTotalPointsAwarded(long totalPointsAwarded) { this.totalPointsAwarded = totalPointsAwarded; }
    public long getActiveBagsCount() { return activeBagsCount; }
    public void setActiveBagsCount(long activeBagsCount) { this.activeBagsCount = activeBagsCount; }
    public long getPendingPickupsCount() { return pendingPickupsCount; }
    public void setPendingPickupsCount(long pendingPickupsCount) { this.pendingPickupsCount = pendingPickupsCount; }
    public long getPendingVerificationsCount() { return pendingVerificationsCount; }
    public void setPendingVerificationsCount(long pendingVerificationsCount) { this.pendingVerificationsCount = pendingVerificationsCount; }
    public long getVerifiedCount() { return verifiedCount; }
    public void setVerifiedCount(long verifiedCount) { this.verifiedCount = verifiedCount; }
    public long getTotalUsersCount() { return totalUsersCount; }
    public void setTotalUsersCount(long totalUsersCount) { this.totalUsersCount = totalUsersCount; }
    public long getTotalRedemptionsCount() { return totalRedemptionsCount; }
    public void setTotalRedemptionsCount(long totalRedemptionsCount) { this.totalRedemptionsCount = totalRedemptionsCount; }
}
