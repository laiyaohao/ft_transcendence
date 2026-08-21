// src/main/java/com/fttranscendence/authservice/repository/UserRepository.java
package com.fttranscendence.profileservice.repository;

import com.fttranscendence.profileservice.model.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long> {
  Optional<Tutor> findByUserId(Long userId);
  boolean existsByUserId(Long userId);
}