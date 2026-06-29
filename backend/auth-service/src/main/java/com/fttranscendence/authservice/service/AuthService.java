// src/main/java/com/fttranscendence/authservice/service/AuthService.java
package com.fttranscendence.authservice.service;

import com.fttranscendence.authservice.dto.AuthRequest;
import com.fttranscendence.authservice.dto.AuthResponse;
import com.fttranscendence.authservice.dto.RegisterRequest;
import com.fttranscendence.authservice.model.User;
import com.fttranscendence.authservice.repository.UserRepository;
import com.fttranscendence.authservice.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuthenticationManager authenticationManager;

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("Email already registered");
    }

    var user = new User();
    user.setEmail(request.getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setFullName(request.getFullName());

    userRepository.save(user);

    var jwtToken = jwtService.generateToken(user);
    return AuthResponse.builder()
        .token(jwtToken)
        .email(user.getEmail())
        .fullName(user.getFullName())
        .build();
  }

  public AuthResponse login(AuthRequest request) {
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

    var user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new RuntimeException("User not found"));

    var jwtToken = jwtService.generateToken(user);
    return AuthResponse.builder()
        .token(jwtToken)
        .email(user.getEmail())
        .fullName(user.getFullName())
        .build();
  }
}