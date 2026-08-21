package com.fttranscendence.profileservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpdateParentRequest {
  private String name;
  private String contact;
}