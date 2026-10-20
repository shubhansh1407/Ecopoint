package com.ecopoint.service;

import com.ecopoint.dto.RegisterRequest;
import com.ecopoint.dto.UserResponse;
import com.ecopoint.entity.EcoWallet;
import com.ecopoint.entity.User;
import com.ecopoint.repository.EcoWalletRepository;
import com.ecopoint.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EcoWalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, EcoWalletRepository walletRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Email is already registered: " + req.getEmail());
        }

        User user = new User(
            req.getFullName().trim(),
            req.getEmail().trim().toLowerCase(),
            passwordEncoder.encode(req.getPassword()),
            req.getPhone() != null ? req.getPhone().trim() : "",
            req.getRole() != null ? req.getRole() : User.Role.ROLE_USER
        );

        user = userRepository.save(user);

        // Initialize wallet for new user
        EcoWallet wallet = new EcoWallet(user);
        walletRepository.save(wallet);

        return user;
    }

    public User authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new IllegalStateException("Account is disabled. Please contact administrator.");
        }

        return user;
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    public UserResponse toUserResponse(User user) {
        EcoWallet wallet = walletRepository.findByUser(user).orElse(null);
        int balance = wallet != null ? wallet.getBalance() : 0;
        int totalEarned = wallet != null ? wallet.getTotalEarned() : 0;
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            balance,
            totalEarned,
            user.getCreatedAt()
        );
    }
}
