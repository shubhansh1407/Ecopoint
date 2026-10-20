package com.ecopoint.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "waste_categories")
public class WasteCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String name; // e.g. PLASTIC, ORGANIC, PAPER, METAL, E_WASTE, GLASS

    @Min(1)
    @Column(nullable = false)
    private Integer pointsPerKg = 10;

    private String description;

    @Column(nullable = false)
    private boolean active = true;

    public WasteCategory() {}

    public WasteCategory(String name, Integer pointsPerKg, String description) {
        this.name = name;
        this.pointsPerKg = pointsPerKg;
        this.description = description;
        this.active = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getPointsPerKg() { return pointsPerKg; }
    public void setPointsPerKg(Integer pointsPerKg) { this.pointsPerKg = pointsPerKg; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
