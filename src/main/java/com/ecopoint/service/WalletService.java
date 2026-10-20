package com.ecopoint.service;

import com.ecopoint.entity.EcoWallet;
import com.ecopoint.entity.User;
import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.entity.WalletTransaction;
import com.ecopoint.repository.EcoWalletRepository;
import com.ecopoint.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
public class WalletService {

    private final EcoWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    public WalletService(EcoWalletRepository walletRepository, WalletTransactionRepository transactionRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    public EcoWallet getOrCreateWallet(User user) {
        return walletRepository.findByUser(user)
                .orElseGet(() -> walletRepository.save(new EcoWallet(user)));
    }

    @Transactional
    public WalletTransaction creditPoints(User user, int points, WasteDeposit deposit, String description) {
        if (points <= 0) {
            return null;
        }

        EcoWallet wallet = getOrCreateWallet(user);
        wallet.setBalance(wallet.getBalance() + points);
        wallet.setTotalEarned(wallet.getTotalEarned() + points);
        wallet.setUpdatedAt(Instant.now());
        walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction(
            wallet,
            WalletTransaction.Type.CREDIT_EARNED,
            points,
            wallet.getBalance(),
            deposit,
            description != null ? description : "Points credited for verified deposit"
        );
        return transactionRepository.save(tx);
    }

    @Transactional
    public WalletTransaction debitPoints(User user, int points, String description) {
        if (points <= 0) {
            throw new IllegalArgumentException("Points to debit must be positive");
        }

        EcoWallet wallet = getOrCreateWallet(user);
        if (wallet.getBalance() < points) {
            throw new IllegalStateException("Insufficient EcoPoints balance. Required: " + points + ", Available: " + wallet.getBalance());
        }

        wallet.setBalance(wallet.getBalance() - points);
        wallet.setTotalRedeemed(wallet.getTotalRedeemed() + points);
        wallet.setUpdatedAt(Instant.now());
        walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction(
            wallet,
            WalletTransaction.Type.DEBIT_REDEEMED,
            -points,
            wallet.getBalance(),
            null,
            description != null ? description : "Points redeemed for reward voucher"
        );
        return transactionRepository.save(tx);
    }

    public List<WalletTransaction> getTransactions(User user) {
        EcoWallet wallet = getOrCreateWallet(user);
        return transactionRepository.findByWalletOrderByTimestampDesc(wallet);
    }

    public List<WalletTransaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByTimestampDesc();
    }
}
