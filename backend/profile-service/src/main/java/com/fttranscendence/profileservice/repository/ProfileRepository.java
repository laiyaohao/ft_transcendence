package com.fttranscendence.profileservice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fttranscendence.profileservice.model.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
  Optional<Profile> findByUserId(Long userId);
  boolean existsByUserId(Long userId);
}
