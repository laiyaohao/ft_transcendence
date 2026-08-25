package com.fttranscendence.grading.repository;

import com.fttranscendence.grading.model.Submission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    @Override
    @EntityGraph(attributePaths = {"missingKeywords", "reviews"})
    List<Submission> findAll();

    @EntityGraph(attributePaths = {"missingKeywords", "reviews"})
    List<Submission> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"missingKeywords", "reviews"})
    List<Submission> findBySubmissionDocumentOwnerUserIdOrderByCreatedAtDesc(
        Long ownerUserId
    );

    @EntityGraph(attributePaths = {"missingKeywords", "reviews"})
    List<Submission> findByReviewStatusOrderByCreatedAtAsc(
        Submission.ReviewStatus reviewStatus
    );

    @EntityGraph(attributePaths = {"missingKeywords", "reviews"})
    Optional<Submission> findBySubmissionDocumentIdAndWorksheetQuestionId(
        Long submissionDocumentId,
        Long worksheetQuestionId
    );
}
