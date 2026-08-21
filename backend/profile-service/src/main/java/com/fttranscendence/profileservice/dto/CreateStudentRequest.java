package com.fttranscendence.profileservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentRequest {

  private Long parentId; // Optional - if not provided, student has no parent

  @NotBlank(message = "Student name is required")
  private String name;

  @NotBlank(message = "Contact is required")
  private String contact;

  @NotBlank(message = "Level is required")
  private String level;
}