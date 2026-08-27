package com.fttranscendence.teachingcoreservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "syllabus_topics")
@Data
@NoArgsConstructor
public class SyllabusTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "level", nullable = false)
    private Integer level;  // e.g., 1 = pri_one, 2 = pri_two, etc.

    @Enumerated(EnumType.STRING)
    @Column(name = "subject", nullable = false)
    private Subject subject;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "subtopic")
    private String subtopic;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Question> questions = new ArrayList<>();
}