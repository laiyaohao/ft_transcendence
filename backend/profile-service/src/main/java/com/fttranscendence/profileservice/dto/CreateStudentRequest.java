package com.fttranscendence.profileservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentRequest {
  @NotNull(message = "User ID is required")
  private Long userId;

  private Long parentId; // Optional - if not provided, student has no parent

  @NotBlank(message = "Student name is required")
  private String name;

  @NotBlank(message = "Level is required")
  private String level;
}