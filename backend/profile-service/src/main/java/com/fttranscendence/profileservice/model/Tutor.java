package com.fttranscendence.profileservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tutors")
@Data
@NoArgsConstructor
public class Tutor {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  @Column(name = "user_id", nullable = false, unique = true)
  private Long userId;
  
  @Column(name = "display_name")
  private String displayName;
  
  @Enumerated(EnumType.STRING)
  private Subject subject;
  
  @Enumerated(EnumType.STRING)
  private Level level;
}