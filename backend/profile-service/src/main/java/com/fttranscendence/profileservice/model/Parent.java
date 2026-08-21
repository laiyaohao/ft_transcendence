package com.fttranscendence.profileservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parents")
@Data
@NoArgsConstructor
public class Parent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  // @Column(name = "user_id", nullable = false, unique = true)
  // private Long userId;
  @OneToOne(optional = false)
  @JoinColumn(name = "profile_id", nullable = false, unique = true)
  private Profile profile;
  
  private String name;
  private String contact;
  
  // ✅ @OneToMany - Student is in Profile Service (SAME SERVICE!)
  // Recommended safe configuration
  @OneToMany(mappedBy = "parent", 
              cascade = {CascadeType.PERSIST, CascadeType.MERGE}, 
              fetch = FetchType.LAZY)
  private List<Student> children = new ArrayList<>();

  // Helper method to manage bidirectional relationship properly
  // public void addStudent(Student student) {
  //   children.add(student);
  //   student.setParent(this);
  // }
}
