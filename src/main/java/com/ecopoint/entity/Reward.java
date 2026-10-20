package com.ecopoint.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

@Entity
@Table(name = "rewards")
public class Reward {

    public enum Category {
        VOUCHER,
        ECO_PRODUCT,
        TRANSIT_PASS,
        TREE_PLANTING
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category = Category.VOUCHER;

    @Min(1)
    @Column(nullable = false)
    private Integer pointsCost;

    @Min(0)
    @Column(nullable = false)
    private Integer stock = 10;

    @Column(nullable = false)
    private String sponsorName; // Clearly noted as simulated in UI

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Reward() {}

    public Reward(String title, String description, Category category, Integer pointsCost, Integer stock, String sponsorName) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.pointsCost = pointsCost;
        this.stock = stock;
        this.sponsorName = sponsorName;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public Integer getPointsCost() { return pointsCost; }
    public void setPointsCost(Integer pointsCost) { this.pointsCost = pointsCost; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public String getSponsorName() { return sponsorName; }
    public void setSponsorName(String sponsorName) { this.sponsorName = sponsorName; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
