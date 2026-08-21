package com.fttranscendence.profileservice.service;

import com.fttranscendence.profileservice.client.AuthServiceClient;
import com.fttranscendence.profileservice.dto.CreateParentRequest;
import com.fttranscendence.profileservice.dto.ParentDTO;
import com.fttranscendence.profileservice.dto.UpdateParentRequest;
import com.fttranscendence.profileservice.model.Parent;
import com.fttranscendence.profileservice.model.Profile;
import com.fttranscendence.profileservice.model.ProfileRole;
import com.fttranscendence.profileservice.repository.ParentRepository;
import com.fttranscendence.profileservice.repository.ProfileRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fttranscendence.profileservice.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ParentService {
  private final ProfileRepository profileRepository;
  private final ParentRepository parentRepository;
  private final AuthServiceClient authServiceClient;

  // @Transactional
  // public ParentDTO createParent(CreateParentRequest request) {
  //   // 1. Verify user exists in Auth Service
  //   if (!authServiceClient.userExists(request.getUserId())) {
  //     throw new RuntimeException("User with ID " + request.getUserId() + " does not exist");
  //   }

  //   // 2. Check if user already has a parent profile
  //   if (parentRepository.existsByUserId(request.getUserId())) {
  //     throw new RuntimeException("User already has a parent profile");
  //   }

  //   // 3. Create and save parent
  //   Parent parent = new Parent();
  //   parent.setUserId(request.getUserId());
  //   parent.setName(request.getName());
  //   parent.setContact(request.getContact());

  //   Parent saved = parentRepository.save(parent);

  //   // 4. Return DTO
  //   return ParentDTO.builder()
  //       .id(saved.getId())
  //       .userId(saved.getUserId())
  //       .name(saved.getName())
  //       .contact(saved.getContact())
  //       .build();
  // }
  @Transactional
  public ParentDTO createParent(
      CreateParentRequest request,
      AuthenticatedUser authenticatedUser) {

    Long authenticatedUserId = authenticatedUser.userId();

    if (!"parent".equalsIgnoreCase(authenticatedUser.role())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Only parent users can create parent profiles"
      );
    }

    if (!authServiceClient.userExists(authenticatedUserId)) {
      throw new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          "Authenticated user does not exist"
      );
    }

    if (parentRepository.existsByProfile_UserId(authenticatedUserId)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "User already has a parent profile"
      );
    }

    Profile profile = new Profile();
    profile.setUserId(authenticatedUserId);
    profile.setRole(ProfileRole.PARENT);
    profileRepository.save(profile);

    Parent parent = new Parent();
    parent.setProfile(profile);
    parent.setName(request.getName());
    parent.setContact(request.getContact());

    Parent saved = parentRepository.save(parent);

    return ParentDTO.builder()
        .id(saved.getId())
        .userId(saved.getProfile().getUserId())
        .name(saved.getName())
        .contact(saved.getContact())
        .build();
  }

  public ParentDTO getParentByUserId(Long userId) {
    Parent parent = parentRepository.findByProfile_UserId(userId)
        .orElseThrow(() -> new RuntimeException("Parent not found for user: " + userId));

    return ParentDTO.builder()
        .id(parent.getId())
        .userId(parent.getProfile().getUserId())
        .name(parent.getName())
        .contact(parent.getContact())
        .build();
  }

  public ParentDTO getParentById(Long id) {
    Parent parent = parentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Parent not found: " + id));

    return ParentDTO.builder()
        .id(parent.getId())
        .userId(parent.getProfile().getUserId())
        .name(parent.getName())
        .contact(parent.getContact())
        .build();
  }

  @Transactional
  public ParentDTO updateParent(Long id, UpdateParentRequest request) {
    Parent parent = parentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Parent not found: " + id));

    if (request.getName() != null) {
      parent.setName(request.getName());
    }
    if (request.getContact() != null) {
      parent.setContact(request.getContact());
    }

    Parent updated = parentRepository.save(parent);

    return ParentDTO.builder()
        .id(updated.getId())
        .userId(updated.getProfile().getUserId())
        .name(updated.getName())
        .contact(updated.getContact())
        .build();
  }

  @Transactional
  public void deleteParent(Long id) {
    Parent parent = parentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Parent not found: " + id));

    // Check if parent has students
    if (!parent.getChildren().isEmpty()) {
      throw new RuntimeException("Cannot delete parent with existing students. Remove students first.");
    }

    parentRepository.delete(parent);
  }
}