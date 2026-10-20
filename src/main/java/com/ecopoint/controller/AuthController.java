package com.ecopoint.controller;

import com.ecopoint.dto.LoginRequest;
import com.ecopoint.dto.RegisterRequest;
import com.ecopoint.dto.UserResponse;
import com.ecopoint.entity.User;
import com.ecopoint.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(AuthService authService, SecurityContextRepository securityContextRepository) {
        this.authService = authService;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request, HttpServletResponse response) {
        User user = authService.register(req);
        setAuthenticatedSession(user, request, response);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request, HttpServletResponse response) {
        User user = authService.authenticate(req.getEmail(), req.getPassword());
        setAuthenticatedSession(user, request, response);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PostMapping("/switch-demo")
    public ResponseEntity<UserResponse> switchDemo(@RequestBody Map<String, String> body, HttpServletRequest request, HttpServletResponse response) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required for demo switch");
        }
        User user = authService.getByEmail(email);
        setAuthenticatedSession(user, request, response);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = authService.getByEmail(principal.getName());
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private void setAuthenticatedSession(User user, HttpServletRequest request, HttpServletResponse response) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        Authentication auth = new UsernamePasswordAuthenticationToken(
            user.getEmail(),
            null,
            Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}
