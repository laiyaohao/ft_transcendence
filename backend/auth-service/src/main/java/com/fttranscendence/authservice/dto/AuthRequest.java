// src/main/java/com/fttranscendence/authservice/dto/AuthRequest.java
package com.fttranscendence.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
  @NotBlank
  @Email
  private String email;
  @NotBlank
  private String password;
}