package com.fttranscendence.profileservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTutorRequest {
  @NotNull(message = "User ID is required")
  private Long userId;


  private String displayName;

  @NotNull(message = "Subject is required")
  private String subject;

  @NotNull(message = "Level is required")
  private String level;
}
