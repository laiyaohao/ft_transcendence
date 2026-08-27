package com.fttranscendence.teachingcoreservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "classes")
@Data
@NoArgsConstructor
public class Class {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tutor_id", nullable = false)
    private Long tutorId;  // References Tutor in Profile Service (cross-service)

    @Column(name = "class_name", nullable = false)
    private String className;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false)
    private Level level;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject", nullable = false)
    private Subject subject;

    @Column(name = "schedule")
    private String schedule;

    @OneToMany(mappedBy = "classEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClassStudent> students = new ArrayList<>();
}