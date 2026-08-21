package com.fttranscendence.profileservice.dto;

import com.fttranscendence.profileservice.model.Level;
import com.fttranscendence.profileservice.model.Subject;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TutorDTO {
  private Long id;
  private Long userId;
  private String displayName;
  private Subject subject;
  private Level level;
}
