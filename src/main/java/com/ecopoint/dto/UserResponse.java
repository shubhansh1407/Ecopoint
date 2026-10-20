package com.ecopoint.dto;

import com.ecopoint.entity.User;
import java.time.Instant;

public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private User.Role role;
    private Integer pointsBalance;
    private Integer totalEarned;
    private Instant createdAt;

    public UserResponse() {}

    public UserResponse(Long id, String fullName, String email, String phone, User.Role role, Integer pointsBalance, Integer totalEarned, Instant createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.pointsBalance = pointsBalance;
        this.totalEarned = totalEarned;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }

    public Integer getPointsBalance() { return pointsBalance; }
    public void setPointsBalance(Integer pointsBalance) { this.pointsBalance = pointsBalance; }

    public Integer getTotalEarned() { return totalEarned; }
    public void setTotalEarned(Integer totalEarned) { this.totalEarned = totalEarned; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
