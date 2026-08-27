package com.fttranscendence.teachingcoreservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private SyllabusTopic topic;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "model_answer", columnDefinition = "TEXT")
    private String modelAnswer;

    @Column(name = "solution_steps", columnDefinition = "TEXT")
    private String solutionSteps;

    @Column(name = "difficulty")
    private String difficulty;  // e.g., "easy", "medium", "hard"

    @Column(name = "question_type")
    private String questionType;  // e.g., "mcq", "open_ended", "fill_blank"

    @Column(name = "source_file_id")
    private Long sourceFileId;  // Reference to file storage (future feature)

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuestionTag> tags = new ArrayList<>();
}