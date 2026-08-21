package com.fttranscendence.profileservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParentDTO {
  private Long id;
  private Long userId;
  private String name;
  private String contact;
}
