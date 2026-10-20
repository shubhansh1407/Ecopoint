package com.ecopoint.repository;

import com.ecopoint.entity.Bag;
import com.ecopoint.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BagRepository extends JpaRepository<Bag, Long> {
    Optional<Bag> findByBagCode(String bagCode);
    boolean existsByBagCode(String bagCode);
    List<Bag> findByAssignedUser(User user);
}
