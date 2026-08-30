// src/main/java/com/fttranscendence/authservice/service/AuthService.java
package com.fttranscendence.authservice.service;

import com.fttranscendence.authservice.dto.AuthRequest;
import com.fttranscendence.authservice.dto.AuthResponse;
import com.fttranscendence.authservice.dto.RegisterRequest;
import com.fttranscendence.authservice.dto.StudentDirectoryResponse;
import com.fttranscendence.authservice.model.User;
import com.fttranscendence.authservice.model.UserRole;
import com.fttranscendence.authservice.repository.UserRepository;
import com.fttranscendence.authservice.security.JwtService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuthenticationManager authenticationManager;

  public AuthResponse register(RegisterRequest request) {
    if (request.getRole() != UserRole.STUDENT) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Tutor accounts cannot be created through public registration"
      );
    }

    String normalizedEmail = normalizeEmail(request.getEmail());
    if (userRepository.existsByEmail(normalizedEmail)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    }

    var user = new User();
    user.setEmail(normalizedEmail);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setFullName(request.getFullName().trim());
    user.setRole(UserRole.STUDENT);

    try {
      userRepository.save(user);
    } catch (DataIntegrityViolationException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    }

    var jwtToken = jwtService.generateToken(user);
    return AuthResponse.builder()
        .token(jwtToken)
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .build();
  }

  public AuthResponse login(AuthRequest request) {
    String normalizedEmail = normalizeEmail(request.getEmail());
    try {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));
    } catch (AuthenticationException ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    var user = userRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

    var jwtToken = jwtService.generateToken(user);
    return AuthResponse.builder()
        .token(jwtToken)
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .build();
  }

  /**
   * Account-role filtering remains in the service that owns identities. This
   * intentionally exposes no credentials or broader user-directory fields.
   */
  public List<StudentDirectoryResponse> listStudentAccounts(String search) {
    String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
    return userRepository.findAllByRoleOrderByFullnameAscEmailAsc(UserRole.STUDENT).stream()
        .filter(user -> normalizedSearch.isEmpty()
            || user.getFullName().toLowerCase(Locale.ROOT).contains(normalizedSearch)
            || user.getEmail().toLowerCase(Locale.ROOT).contains(normalizedSearch))
        .map(StudentDirectoryResponse::from)
        .toList();
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }
}
