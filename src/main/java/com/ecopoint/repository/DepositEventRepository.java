package com.ecopoint.repository;

import com.ecopoint.entity.DepositEvent;
import com.ecopoint.entity.WasteDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepositEventRepository extends JpaRepository<DepositEvent, Long> {
    List<DepositEvent> findByDepositOrderByTimestampAsc(WasteDeposit deposit);
}
