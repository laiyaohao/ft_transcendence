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
public class CreateParentRequest {
  @NotNull(message = "User ID is required")
  private Long userId;

  @NotBlank(message = "Parent name is required")
  private String name;

  @NotBlank(message = "Contact number is required")
  private String contact;
}