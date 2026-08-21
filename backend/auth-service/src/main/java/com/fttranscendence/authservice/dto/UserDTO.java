package com.fttranscendence.authservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
  private Long id;
  private String email;
  private String fullName;
  private String role;
}