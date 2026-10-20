package com.ecopoint.repository;

import com.ecopoint.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findByActiveTrueOrderByPointsCostAsc();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Reward r SET r.stock = r.stock - 1 WHERE r.id = :id AND r.stock > 0 AND r.active = true")
    int decrementStockIfAvailable(@org.springframework.data.repository.query.Param("id") Long id);
}
