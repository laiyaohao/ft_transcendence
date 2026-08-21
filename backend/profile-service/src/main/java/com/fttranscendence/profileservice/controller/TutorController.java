package com.fttranscendence.profileservice.controller;

import com.fttranscendence.profileservice.dto.CreateTutorRequest;
import com.fttranscendence.profileservice.dto.TutorDTO;
import com.fttranscendence.profileservice.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.fttranscendence.profileservice.security.AuthenticatedUser;

@RestController
@RequestMapping("/api/tutors")
@RequiredArgsConstructor
public class TutorController {
  private final TutorService tutorService;

  @PostMapping
  public ResponseEntity<TutorDTO> createTutor(
    @Valid @RequestBody CreateTutorRequest request,
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(tutorService.createTutor(request, authenticatedUser));
  }

  // @GetMapping("/user/{userId}")
  // public ResponseEntity<TutorDTO> getTutorByUserId(@PathVariable Long userId) {
  //   return ResponseEntity.ok(tutorService.getTutorByUserId(userId));
  // }

  @GetMapping("/{id}")
  public ResponseEntity<TutorDTO> getTutorById(@PathVariable Long id) {
    return ResponseEntity.ok(tutorService.getTutorById(id));
  }
}