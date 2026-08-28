package com.fttranscendence.learning.mastery;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MasteryApprovedResultRepository extends JpaRepository<MasteryApprovedResult, Long> {
    Optional<MasteryApprovedResult> findBySourceSubmissionId(Long sourceSubmissionId);
    List<MasteryApprovedResult> findByStudentProfileIdAndSyllabusTopicIdAndActiveTrueOrderByReviewedAtAscSourceSubmissionIdAsc(Long studentProfileId, Long syllabusTopicId);
    Optional<MasteryApprovedResult> findFirstByStudentProfileIdAndActiveTrueOrderByReviewedAtDescSourceSubmissionIdDesc(Long studentProfileId);
    List<MasteryApprovedResult> findByStudentProfileIdAndWorksheetIdAndActiveTrueOrderByReviewedAtAscSourceSubmissionIdAsc(Long studentProfileId, Long worksheetId);
}
