package com.ecopoint.repository;

import com.ecopoint.entity.EcoWallet;
import com.ecopoint.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletOrderByTimestampDesc(EcoWallet wallet);
    List<WalletTransaction> findAllByOrderByTimestampDesc();
}
