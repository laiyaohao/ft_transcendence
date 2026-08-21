// src/main/java/com/fttranscendence/profileservice/repository/StudentRepository.java
package com.fttranscendence.profileservice.repository;

import com.fttranscendence.profileservice.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
  Optional<Student> findByUserId(Long userId);
  List<Student> findByParentId(Long parentId);
  boolean existsByUserId(Long userId);
}