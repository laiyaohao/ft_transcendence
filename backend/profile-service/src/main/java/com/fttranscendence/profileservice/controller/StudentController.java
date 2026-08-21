package com.fttranscendence.profileservice.controller;

import com.fttranscendence.profileservice.dto.CreateStudentRequest;
import com.fttranscendence.profileservice.dto.StudentDTO;
import com.fttranscendence.profileservice.security.AuthenticatedUser;
import com.fttranscendence.profileservice.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
  private final StudentService studentService;

  @PostMapping
  public ResponseEntity<StudentDTO> createStudent(
    @Valid @RequestBody CreateStudentRequest request,
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(studentService.createStudent(request, authenticatedUser));
  }

  // @GetMapping("/user/{userId}")
  // public ResponseEntity<StudentDTO> getStudentByUserId(@PathVariable Long userId) {
  //   return ResponseEntity.ok(studentService.getStudentByUserId(userId));
  // }

  @GetMapping("/parent/{parentId}")
  public ResponseEntity<List<StudentDTO>> getStudentsByParentId(@PathVariable Long parentId) {
    return ResponseEntity.ok(studentService.getStudentsByParentId(parentId));
  }
}
