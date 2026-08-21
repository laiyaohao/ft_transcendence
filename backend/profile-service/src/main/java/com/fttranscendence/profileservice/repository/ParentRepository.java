// src/main/java/com/fttranscendence/profileservice/repository/ParentRepository.java
package com.fttranscendence.profileservice.repository;

import com.fttranscendence.profileservice.model.Parent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParentRepository extends JpaRepository<Parent, Long> {
  Optional<Parent> findByProfile_UserId(Long userId);
  boolean existsByProfile_UserId(Long userId);
}