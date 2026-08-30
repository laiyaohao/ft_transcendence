package com.fttranscendence.grading.repository;
import com.fttranscendence.grading.model.SubmissionDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SubmissionDocumentRepository extends JpaRepository<SubmissionDocument, Long> {
    /**
     * A numeric user id is only meaningful together with its authenticated role.
     * Keeping both parts in the lookup prevents a token with a colliding subject
     * from crossing between Tutor- and Student-owned submissions.
     */
    Optional<SubmissionDocument> findByIdAndOwnerUserIdAndOwnerRole(
        Long id,
        Long ownerUserId,
        SubmissionDocument.OwnerRole ownerRole
    );

    Optional<SubmissionDocument> findByOwnerUserIdAndOwnerRoleAndWorksheetIdAndStudentIdAndSourceType(
        Long ownerUserId,
        SubmissionDocument.OwnerRole ownerRole,
        Long worksheetId,
        Long studentId,
        SubmissionDocument.SourceType sourceType
    );
}
