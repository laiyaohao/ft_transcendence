package com.fttranscendence.learning.mastery;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasteryDiagnosticEvidenceRepository extends JpaRepository<MasteryDiagnosticEvidence, Long> {
    boolean existsBySourceSubmissionId(Long sourceSubmissionId);

    void deleteBySourceSubmissionId(Long sourceSubmissionId);

    @EntityGraph(attributePaths = {"masteryRecord", "studentProfile", "missingKeywords"})
    List<MasteryDiagnosticEvidence> findByStudentProfileIdOrderByCreatedAtDescIdDesc(Long studentProfileId);

    long countByMasteryRecordIdAndCategory(Long masteryRecordId, MasteryDiagnosticEvidence.Category category);
}
