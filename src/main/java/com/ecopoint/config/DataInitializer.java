package com.ecopoint.config;

import com.ecopoint.entity.*;
import com.ecopoint.repository.*;
import com.ecopoint.service.WalletService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            WasteCategoryRepository categoryRepository,
            BagRepository bagRepository,
            WasteDepositRepository depositRepository,
            DepositEventRepository eventRepository,
            EcoWalletRepository walletRepository,
            RewardRepository rewardRepository,
            WalletService walletService,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Categories if empty
            if (categoryRepository.count() == 0) {
                categoryRepository.saveAll(List.of(
                    new WasteCategory("PLASTIC", 10, "Clean rigid plastics (PET, HDPE) and containers"),
                    new WasteCategory("ORGANIC", 5, "Kitchen scraps, raw food waste and compostable organics"),
                    new WasteCategory("PAPER", 8, "Clean paper, cardboard boxes and newspapers"),
                    new WasteCategory("METAL", 15, "Aluminium drink cans, tins and clean metallic scrap"),
                    new WasteCategory("E_WASTE", 25, "Defunct electronics, cables, chargers and small appliances"),
                    new WasteCategory("GLASS", 7, "Clean beverage bottles, glass jars and containers")
                ));
            }

            // Seed Users if empty
            if (userRepository.count() == 0) {
                String encodedPwd = passwordEncoder.encode("password123");

                User admin = new User("Platform Admin", "admin@ecopoint.com", encodedPwd, "9876543210", User.Role.ROLE_ADMIN);
                User operator = new User("Rajesh Verma (Facility)", "operator@ecopoint.com", encodedPwd, "9876543211", User.Role.ROLE_OPERATOR);
                User collector = new User("Suresh Patil (Collector)", "collector@ecopoint.com", encodedPwd, "9876543212", User.Role.ROLE_COLLECTOR);
                User citizen = new User("Aarav Sharma (Citizen)", "user@ecopoint.com", encodedPwd, "9876543213", User.Role.ROLE_USER);

                userRepository.saveAll(List.of(admin, operator, collector, citizen));

                // Initialize wallets
                walletRepository.save(new EcoWallet(admin));
                walletRepository.save(new EcoWallet(operator));
                walletRepository.save(new EcoWallet(collector));
                EcoWallet userWallet = walletRepository.save(new EcoWallet(citizen));

                // Pre-seed bags
                Bag bag1 = bagRepository.save(new Bag("BAG-1001", citizen));
                Bag bag2 = bagRepository.save(new Bag("BAG-1002", citizen));
                Bag bag3 = bagRepository.save(new Bag("BAG-1003", citizen));
                Bag bag4 = bagRepository.save(new Bag("BAG-1004", null));
                Bag bag5 = bagRepository.save(new Bag("BAG-1005", null));

                // Pre-seed rewards (Simulated/Demo partners)
                rewardRepository.saveAll(List.of(
                    new Reward("₹100 Organic Grocer Voucher", "Redeemable at local organic farmers co-op store", Reward.Category.VOUCHER, 100, 25, "GreenHarvest Organics (Simulated)"),
                    new Reward("Bamboo Cutlery & Steel Straw Kit", "Zero-waste portable travel set with organic cotton pouch", Reward.Category.ECO_PRODUCT, 150, 15, "EcoEarth Living (Simulated)"),
                    new Reward("City Transit Day Pass", "Full day unlimited access to municipal bus & metro network", Reward.Category.TRANSIT_PASS, 75, 40, "City Transit Authority (Simulated)"),
                    new Reward("Plant 1 Native Tree in City Park", "Certificate of plantation with GPS tag in municipal forest belt", Reward.Category.TREE_PLANTING, 50, 100, "Urban Green Canopy (Simulated)")
                ));

                // Pre-seed sample historical deposit (already verified)
                WasteCategory plastic = categoryRepository.findByName("PLASTIC").orElse(null);
                if (plastic != null) {
                    WasteDeposit historicalDep = new WasteDeposit("DEP-2026-1001", citizen, bag3, plastic, 4.5);
                    historicalDep.setStatus(WasteDeposit.Status.VERIFIED);
                    historicalDep.setCollector(collector);
                    historicalDep.setFacilityOperator(operator);
                    historicalDep.setActualCategory(plastic);
                    historicalDep.setActualWeight(4.2);
                    historicalDep.setProcessingOutcome(WasteDeposit.Outcome.RECYCLED);
                    historicalDep.setPickedUpAt(Instant.now().minus(2, ChronoUnit.DAYS));
                    historicalDep.setVerifiedAt(Instant.now().minus(1, ChronoUnit.DAYS));
                    historicalDep.setPointsAwarded(40);
                    historicalDep.setIsPointsCredited(true);
                    depositRepository.save(historicalDep);

                    // Add events
                    eventRepository.save(new DepositEvent(historicalDep, WasteDeposit.Status.SUBMITTED, citizen.getFullName(), "ROLE_USER", "Registered 4.5 kg estimated plastic"));
                    eventRepository.save(new DepositEvent(historicalDep, WasteDeposit.Status.PICKED_UP, collector.getFullName(), "ROLE_COLLECTOR", "Collected from residential pickup point"));
                    eventRepository.save(new DepositEvent(historicalDep, WasteDeposit.Status.AT_FACILITY, operator.getFullName(), "ROLE_OPERATOR", "Received at Material Recovery Facility"));
                    eventRepository.save(new DepositEvent(historicalDep, WasteDeposit.Status.VERIFIED, operator.getFullName(), "ROLE_OPERATOR", "Verified: 4.2 kg accepted, 40 EcoPoints credited. Outcome: RECYCLED"));

                    // Credit historical points to wallet
                    walletService.creditPoints(citizen, 40, historicalDep, "EcoPoints for deposit DEP-2026-1001 (PLASTIC 4.2 kg)");
                    // Extra welcome points so user can test redeeming rewards immediately
                    walletService.creditPoints(citizen, 150, null, "EcoPoint onboarding & waste segregation welcome bonus");
                }

                // Pre-seed a deposit currently waiting for pickup
                WasteCategory metal = categoryRepository.findByName("METAL").orElse(null);
                if (metal != null) {
                    WasteDeposit pendingPickup = new WasteDeposit("DEP-2026-1002", citizen, bag2, metal, 2.0);
                    pendingPickup.setStatus(WasteDeposit.Status.SUBMITTED);
                    depositRepository.save(pendingPickup);
                    eventRepository.save(new DepositEvent(pendingPickup, WasteDeposit.Status.SUBMITTED, citizen.getFullName(), "ROLE_USER", "Bag placed outside for collector pickup"));
                }
            }
        };
    }
}
