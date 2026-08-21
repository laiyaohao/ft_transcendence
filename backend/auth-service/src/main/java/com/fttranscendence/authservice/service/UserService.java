package com.fttranscendence.authservice.service;

import org.springframework.stereotype.Service;

import com.fttranscendence.authservice.dto.UserDTO;
import com.fttranscendence.authservice.model.User;
import com.fttranscendence.authservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  
  public UserDTO getUser(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found: " + id));
    return UserDTO.builder()
        .id(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .build();
  }
}
