package com.fttranscendence.profileservice.service;

import com.fttranscendence.profileservice.client.AuthServiceClient;
import com.fttranscendence.profileservice.dto.CreateStudentRequest;
import com.fttranscendence.profileservice.dto.StudentDTO;
import com.fttranscendence.profileservice.model.Level;
import com.fttranscendence.profileservice.model.Parent;
import com.fttranscendence.profileservice.model.Student;
import com.fttranscendence.profileservice.repository.ParentRepository;
import com.fttranscendence.profileservice.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {
  private final StudentRepository studentRepository;
  private final ParentRepository parentRepository;
  private final AuthServiceClient authServiceClient;

  @Transactional
  public StudentDTO createStudent(CreateStudentRequest request) {
    // 1. Verify user exists
    if (!authServiceClient.userExists(request.getUserId())) {
      throw new RuntimeException("User does not exist");
    }

    // 2. Check if user already has a student profile
    if (studentRepository.existsByUserId(request.getUserId())) {
      throw new RuntimeException("User already has a student profile");
    }

    // 3. Handle parent relationship
    Parent parent = null;
    if (request.getParentId() != null) {
      parent = parentRepository.findById(request.getParentId())
          .orElseThrow(() -> new RuntimeException("Parent not found with ID: " + request.getParentId()));
    }

    // 4. Create student
    Student student = new Student();
    student.setUserId(request.getUserId());
    student.setParent(parent);
    student.setName(request.getName());
    student.setLevel(Level.valueOf(request.getLevel()));

    Student saved = studentRepository.save(student);

    // 5. Build DTO with parent info (if parent exists)
    StudentDTO.StudentDTOBuilder builder = StudentDTO.builder()
        .id(saved.getId())
        .userId(saved.getUserId())
        .name(saved.getName())
        .level(saved.getLevel());

    if (saved.getParent() != null) {
      builder.parentId(saved.getParent().getId())
          .parentName(saved.getParent().getName())
          .parentContact(saved.getParent().getContact());
    }

    return builder.build();
  }

  public StudentDTO getStudentByUserId(Long userId) {
    Student student = studentRepository.findByUserId(userId)
        .orElseThrow(() -> new RuntimeException("Student not found for user: " + userId));

    StudentDTO.StudentDTOBuilder builder = StudentDTO.builder()
        .id(student.getId())
        .userId(student.getUserId())
        .name(student.getName())
        .level(student.getLevel());

    if (student.getParent() != null) {
      builder.parentId(student.getParent().getId())
          .parentName(student.getParent().getName())
          .parentContact(student.getParent().getContact());
    }

    return builder.build();
  }

  public List<StudentDTO> getStudentsByParentId(Long parentId) {
    return studentRepository.findByParentId(parentId)
        .stream()
        .map(student -> {
          StudentDTO.StudentDTOBuilder builder = StudentDTO.builder()
              .id(student.getId())
              .userId(student.getUserId())
              .name(student.getName())
              .level(student.getLevel());

          if (student.getParent() != null) {
            builder.parentId(student.getParent().getId())
                .parentName(student.getParent().getName())
                .parentContact(student.getParent().getContact());
          }

          return builder.build();
        })
        .collect(Collectors.toList());
  }
}