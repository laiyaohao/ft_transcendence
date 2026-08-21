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


  // private String displayName;

  @NotNull(message = "name is required")
  private String name;

  @NotNull(message = "contact is required")
  private String contact;

  @NotNull(message = "Subject is required")
  private String subject;

  @NotNull(message = "Level is required")
  private String level;
}
