package com.ecopoint.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "eco_wallets")
public class EcoWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer balance = 0;

    @Column(nullable = false)
    private Integer totalEarned = 0;

    @Column(nullable = false)
    private Integer totalRedeemed = 0;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public EcoWallet() {}

    public EcoWallet(User user) {
        this.user = user;
        this.balance = 0;
        this.totalEarned = 0;
        this.totalRedeemed = 0;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getBalance() { return balance; }
    public void setBalance(Integer balance) { this.balance = balance; }

    public Integer getTotalEarned() { return totalEarned; }
    public void setTotalEarned(Integer totalEarned) { this.totalEarned = totalEarned; }

    public Integer getTotalRedeemed() { return totalRedeemed; }
    public void setTotalRedeemed(Integer totalRedeemed) { this.totalRedeemed = totalRedeemed; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
