package com.ecopoint.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "wallet_transactions", indexes = {
    @Index(name = "idx_tx_wallet", columnList = "wallet_id")
})
public class WalletTransaction {

    public enum Type {
        CREDIT_EARNED,
        DEBIT_REDEEMED,
        ADMIN_ADJUSTMENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private EcoWallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private Integer balanceAfter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_id")
    private WasteDeposit deposit;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    public WalletTransaction() {}

    public WalletTransaction(EcoWallet wallet, Type type, Integer points, Integer balanceAfter, WasteDeposit deposit, String description) {
        this.wallet = wallet;
        this.type = type;
        this.points = points;
        this.balanceAfter = balanceAfter;
        this.deposit = deposit;
        this.description = description;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EcoWallet getWallet() { return wallet; }
    public void setWallet(EcoWallet wallet) { this.wallet = wallet; }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public Integer getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(Integer balanceAfter) { this.balanceAfter = balanceAfter; }

    public WasteDeposit getDeposit() { return deposit; }
    public void setDeposit(WasteDeposit deposit) { this.deposit = deposit; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    @Transient
    public String getUserFullName() {
        if (wallet != null && wallet.getUser() != null) {
            return wallet.getUser().getFullName();
        }
        return null;
    }

    @Transient
    public String getReferenceId() {
        if (deposit != null && deposit.getDepositCode() != null) {
            return deposit.getDepositCode();
        }
        return null;
    }

    @Transient
    public Instant getCreatedAt() {
        return timestamp;
    }
}
