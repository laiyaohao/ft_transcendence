// src/main/java/com/fttranscendence/authservice/dto/RegisterRequest.java
package com.fttranscendence.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
  @NotBlank
  @Email
  private String email;
  @NotBlank
  private String password;
  @NotBlank
  private String fullName;
}