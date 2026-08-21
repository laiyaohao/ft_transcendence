package com.fttranscendence.profileservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
public class Student {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  // @Column(name = "user_id", nullable = false, unique = true)
  // private Long userId;
  @OneToOne(optional = false)
  @JoinColumn(name = "profile_id", nullable = false, unique = true)
  private Profile profile;
  
  // ✅ @ManyToOne - Parent is in Profile Service (SAME SERVICE!)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  // not every student's parents will sign up, so nullable = true (default value)
  // some students may have same parents (siblings), so unique = false (default value)
  private Parent parent;
  
  private String name;
  private String contact;
  
  @Enumerated(EnumType.STRING)
  private Level level;
}
