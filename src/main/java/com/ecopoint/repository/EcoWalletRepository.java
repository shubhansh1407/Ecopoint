package com.ecopoint.repository;

import com.ecopoint.entity.EcoWallet;
import com.ecopoint.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EcoWalletRepository extends JpaRepository<EcoWallet, Long> {
    Optional<EcoWallet> findByUser(User user);
    Optional<EcoWallet> findByUserId(Long userId);
}
