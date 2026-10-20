package com.ecopoint.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "deposit_events", indexes = {
    @Index(name = "idx_event_deposit", columnList = "deposit_id")
})
public class DepositEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_id", nullable = false)
    private WasteDeposit deposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WasteDeposit.Status status;

    private String actorName;

    private String actorRole;

    @Column(length = 500)
    private String note;

    @Column(nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    public DepositEvent() {}

    public DepositEvent(WasteDeposit deposit, WasteDeposit.Status status, String actorName, String actorRole, String note) {
        this.deposit = deposit;
        this.status = status;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.note = note;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public WasteDeposit getDeposit() { return deposit; }
    public void setDeposit(WasteDeposit deposit) { this.deposit = deposit; }

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
