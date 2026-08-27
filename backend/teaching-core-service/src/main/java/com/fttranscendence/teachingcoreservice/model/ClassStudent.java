package com.fttranscendence.teachingcoreservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "class_students")
@Data
@NoArgsConstructor
public class ClassStudent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "class_id", nullable = false)
  private Class classEntity;

  @Column(name = "student_id", nullable = false)
  private Long studentId; // References Student in Profile Service (cross-service)
}