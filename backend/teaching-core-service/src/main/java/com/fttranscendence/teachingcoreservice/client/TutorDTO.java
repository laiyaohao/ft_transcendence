package com.fttranscendence.teachingcoreservice.client;

import com.fttranscendence.teachingcoreservice.model.Level;
import com.fttranscendence.teachingcoreservice.model.Subject;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TutorDTO {
  private Long id;
  private Long userId;
  // private String displayName;
  private Subject subject;
  private Level level;
}
