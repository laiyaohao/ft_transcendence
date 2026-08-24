package com.fttranscendence.grading.repository;

import com.fttranscendence.grading.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
