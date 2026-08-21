package com.fttranscendence.authservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fttranscendence.authservice.dto.UserDTO;
import com.fttranscendence.authservice.repository.UserRepository;
import com.fttranscendence.authservice.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserRepository userRepository;
  private final UserService userService;

  @GetMapping("/exists/{id}")
  public ResponseEntity<Boolean> userExists(@PathVariable long id) {
    return ResponseEntity.ok(userRepository.existsById(id));
  }

  @GetMapping("/{id}")
  public ResponseEntity<UserDTO> getUser(@PathVariable long id) {
    return ResponseEntity.ok(userService.getUser(id));
  }
}