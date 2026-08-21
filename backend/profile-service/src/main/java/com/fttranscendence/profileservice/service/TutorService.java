package com.fttranscendence.profileservice.service;

import com.fttranscendence.profileservice.client.AuthServiceClient;
import com.fttranscendence.profileservice.dto.CreateTutorRequest;
import com.fttranscendence.profileservice.dto.TutorDTO;
import com.fttranscendence.profileservice.model.Level;
import com.fttranscendence.profileservice.model.Profile;
import com.fttranscendence.profileservice.model.ProfileRole;
import com.fttranscendence.profileservice.model.Subject;
import com.fttranscendence.profileservice.model.Tutor;
import com.fttranscendence.profileservice.repository.ProfileRepository;
import com.fttranscendence.profileservice.repository.TutorRepository;
import com.fttranscendence.profileservice.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TutorService {
    private final ProfileRepository profileRepository;
  private final TutorRepository tutorRepository;
  private final AuthServiceClient authServiceClient;

  @Transactional
  public TutorDTO createTutor(
    CreateTutorRequest request,
    AuthenticatedUser authenticatedUser) {
    // // 1. Verify user exists in Auth Service
    // if (!authServiceClient.userExists(request.getUserId())) {
    //   throw new RuntimeException("User with ID " + request.getUserId() + " does not exist");
    // }

    // // 2. Check if user already has a tutor profile
    // if (tutorRepository.existsByUserId(request.getUserId())) {
    //   throw new RuntimeException("User already has a tutor profile");
    // }

    // // 3. Create and save tutor
    // Tutor tutor = new Tutor();
    // tutor.setUserId(request.getUserId());
    // tutor.setDisplayName(request.getDisplayName());
    // tutor.setSubject(Subject.valueOf(request.getSubject()));
    // tutor.setLevel(Level.valueOf(request.getLevel()));

    // Tutor saved = tutorRepository.save(tutor);

    // // 4. Return DTO
    // return TutorDTO.builder()
    //         .id(saved.getId())
    //         .userId(saved.getUserId())
    //         .displayName(saved.getDisplayName())
    //         .subject(saved.getSubject())
    //         .level(saved.getLevel())
    //         .build();
    Long authenticatedUserId = authenticatedUser.userId();
    if (!"tutor".equalsIgnoreCase(authenticatedUser.role())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Only tutor users can create tutor profiles"
      );
    }
    if (!authServiceClient.userExists(authenticatedUserId)) {
      throw new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          "Authenticated user does not exist"
      );
    }
    if (tutorRepository.existsByProfile_UserId(authenticatedUserId)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "User already has a tutor profile"
      );
    }
    Profile profile = new Profile();
    profile.setUserId(authenticatedUserId);
    profile.setRole(ProfileRole.TUTOR);
    profileRepository.save(profile);

    // 3. Create and save tutor
    Tutor tutor = new Tutor();
    tutor.setProfile(profile);
    tutor.setSubject(Subject.valueOf(request.getSubject()));
    tutor.setLevel(Level.valueOf(request.getLevel()));

    Tutor saved = tutorRepository.save(tutor);
    // 4. Return DTO
    return TutorDTO.builder()
            .id(saved.getId())
            .userId(saved.getProfile().getUserId())
            .subject(saved.getSubject())
            .level(saved.getLevel())
            .build();
  }

  public TutorDTO getTutorByUserId(Long userId) {
      Tutor tutor = tutorRepository.findByProfile_UserId(userId)
              .orElseThrow(() -> new RuntimeException("Tutor not found for user: " + userId));
      
      return TutorDTO.builder()
              .id(tutor.getId())
              .userId(tutor.getProfile().getUserId())
              .subject(tutor.getSubject())
              .level(tutor.getLevel())
              .build();
  }

  public TutorDTO getTutorById(Long id) {
    Tutor tutor = tutorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tutor not found: " + id));
    
    return TutorDTO.builder()
            .id(tutor.getId())
            .userId(tutor.getProfile().getUserId())
            .subject(tutor.getSubject())
            .level(tutor.getLevel())
            .build();
  }
}