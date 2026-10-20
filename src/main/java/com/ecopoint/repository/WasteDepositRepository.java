package com.ecopoint.repository;

import com.ecopoint.entity.Bag;
import com.ecopoint.entity.User;
import com.ecopoint.entity.WasteDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WasteDepositRepository extends JpaRepository<WasteDeposit, Long> {
    Optional<WasteDeposit> findByDepositCode(String depositCode);
    List<WasteDeposit> findByUserOrderByCreatedAtDesc(User user);
    List<WasteDeposit> findByStatusOrderByCreatedAtAsc(WasteDeposit.Status status);
    List<WasteDeposit> findByStatusInOrderByCreatedAtAsc(List<WasteDeposit.Status> statuses);
    boolean existsByBagAndStatusIn(Bag bag, List<WasteDeposit.Status> activeStatuses);
    Optional<WasteDeposit> findFirstByBagAndStatusIn(Bag bag, List<WasteDeposit.Status> activeStatuses);
    long countByStatus(WasteDeposit.Status status);
    List<WasteDeposit> findAllByOrderByCreatedAtDesc();
}
