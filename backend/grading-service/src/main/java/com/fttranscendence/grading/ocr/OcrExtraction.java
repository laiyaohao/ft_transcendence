package com.fttranscendence.grading.ocr;

import com.fttranscendence.grading.model.SubmissionPage;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name = "ocr_extractions")
public class OcrExtraction {
  public enum Status { READY, REQUIRES_REVIEW, UNREADABLE }
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "submission_page_id", nullable = false, unique = true) private SubmissionPage page;
  @Column(name = "worksheet_question_id") private Long worksheetQuestionId;
  @Column(name = "extracted_text", nullable = false, columnDefinition = "TEXT") private String extractedText;
  @Column(name = "corrected_text", columnDefinition = "TEXT") private String correctedText;
  @Column(nullable = false, columnDefinition = "numeric(5,4)") private double confidence;
  @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status;
  @Column(nullable = false) private String provider;
  @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
  @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
  protected OcrExtraction() {}
  public OcrExtraction(SubmissionPage page, Long questionId, String text, double confidence, String provider) { this.page=page; worksheetQuestionId=questionId; extractedText=text; this.confidence=confidence; this.provider=provider; status=text.isBlank()?Status.UNREADABLE:confidence<.85?Status.REQUIRES_REVIEW:Status.READY; }
  public void correct(String text) { correctedText=text.trim(); status=Status.READY; }
  @PrePersist void insert(){createdAt=updatedAt=LocalDateTime.now();} @PreUpdate void update(){updatedAt=LocalDateTime.now();}
  public Long getId(){return id;} public SubmissionPage getPage(){return page;} public String getExtractedText(){return extractedText;} public String getCorrectedText(){return correctedText;} public double getConfidence(){return confidence;} public Status getStatus(){return status;}
}
