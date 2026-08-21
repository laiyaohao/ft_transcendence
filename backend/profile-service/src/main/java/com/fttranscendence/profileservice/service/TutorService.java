package com.fttranscendence.profileservice.service;

import com.fttranscendence.profileservice.client.AuthServiceClient;
import com.fttranscendence.profileservice.dto.CreateTutorRequest;
import com.fttranscendence.profileservice.dto.TutorDTO;
import com.fttranscendence.profileservice.model.Level;
import com.fttranscendence.profileservice.model.Subject;
import com.fttranscendence.profileservice.model.Tutor;
import com.fttranscendence.profileservice.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorService {
  private final TutorRepository tutorRepository;
  private final AuthServiceClient authServiceClient;

  @Transactional
  public TutorDTO createTutor(CreateTutorRequest request) {
    // 1. Verify user exists in Auth Service
    if (!authServiceClient.userExists(request.getUserId())) {
      throw new RuntimeException("User with ID " + request.getUserId() + " does not exist");
    }

    // 2. Check if user already has a tutor profile
    if (tutorRepository.existsByUserId(request.getUserId())) {
      throw new RuntimeException("User already has a tutor profile");
    }

    // 3. Create and save tutor
    Tutor tutor = new Tutor();
    tutor.setUserId(request.getUserId());
    tutor.setDisplayName(request.getDisplayName());
    tutor.setSubject(Subject.valueOf(request.getSubject()));
    tutor.setLevel(Level.valueOf(request.getLevel()));

    Tutor saved = tutorRepository.save(tutor);

    // 4. Return DTO
    return TutorDTO.builder()
            .id(saved.getId())
            .userId(saved.getUserId())
            .displayName(saved.getDisplayName())
            .subject(saved.getSubject())
            .level(saved.getLevel())
            .build();
  }

  public TutorDTO getTutorByUserId(Long userId) {
      Tutor tutor = tutorRepository.findByUserId(userId)
              .orElseThrow(() -> new RuntimeException("Tutor not found for user: " + userId));
      
      return TutorDTO.builder()
              .id(tutor.getId())
              .userId(tutor.getUserId())
              .displayName(tutor.getDisplayName())
              .subject(tutor.getSubject())
              .level(tutor.getLevel())
              .build();
  }

  public TutorDTO getTutorById(Long id) {
    Tutor tutor = tutorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tutor not found: " + id));
    
    return TutorDTO.builder()
            .id(tutor.getId())
            .userId(tutor.getUserId())
            .displayName(tutor.getDisplayName())
            .subject(tutor.getSubject())
            .level(tutor.getLevel())
            .build();
  }
}