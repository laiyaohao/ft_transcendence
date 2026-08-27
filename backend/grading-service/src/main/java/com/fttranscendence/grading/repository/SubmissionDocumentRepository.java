package com.fttranscendence.grading.repository;
import com.fttranscendence.grading.model.SubmissionDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SubmissionDocumentRepository extends JpaRepository<SubmissionDocument, Long> { Optional<SubmissionDocument> findByIdAndOwnerUserId(Long id, Long ownerUserId); }
