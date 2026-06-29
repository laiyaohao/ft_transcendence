// src/main/java/com/fttranscendence/authservice/dto/AuthResponse.java
package com.fttranscendence.authservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
  private String token;
  private String email;
  private String fullName;
}