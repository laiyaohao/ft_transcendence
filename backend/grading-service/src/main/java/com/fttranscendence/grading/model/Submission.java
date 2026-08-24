package com.fttranscendence.grading.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "submissions")
public class Submission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "question_id", nullable = false) private String questionId;
    @Column(name = "student_answer", columnDefinition = "TEXT") private String studentAnswer;
    @Column(nullable = false) private String correctness;
    @Column(name = "error_category") private String errorCategory;
    @Column(columnDefinition = "TEXT") private String feedback;
    
    @ElementCollection
    @CollectionTable(name = "submission_missing_keywords", joinColumns = @JoinColumn(name = "submission_id"))
    @Column(name = "keyword")
    private List<String> missingKeywords;
    
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    // Getters and Setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; } public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getQuestionId() { return questionId; } public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getStudentAnswer() { return studentAnswer; } public void setStudentAnswer(String studentAnswer) { this.studentAnswer = studentAnswer; }
    public String getCorrectness() { return correctness; } public void setCorrectness(String correctness) { this.correctness = correctness; }
    public String getErrorCategory() { return errorCategory; } public void setErrorCategory(String errorCategory) { this.errorCategory = errorCategory; }
    public String getFeedback() { return feedback; } public void setFeedback(String feedback) { this.feedback = feedback; }
    public List<String> getMissingKeywords() { return missingKeywords; } public void setMissingKeywords(List<String> missingKeywords) { this.missingKeywords = missingKeywords; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}