package com.fttranscendence.teachingcoreservice.client;

import com.fttranscendence.teachingcoreservice.model.Level;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentDTO {
  private Long id;
  private Long userId;
  private Long parentId;
  private String parentName;    // ← Still included for convenience!
  private String parentContact; // ← Still included for convenience!
  private String name;
  private String contact;
  private Level level;
}