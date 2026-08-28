package com.fttranscendence.learning.mastery;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Private grading-to-learning boundary.  It is protected by both a Tutor JWT and a backend-only key. */
@RestController
@RequestMapping("/api/learning/internal/approved-marking-evidence")
public class ApprovedMarkingSyncController {
    private final MasteryService mastery;
    private final byte[] integrationKey;

    public ApprovedMarkingSyncController(MasteryService mastery,
                                         @Value("${learning.marking-sync-key}") String integrationKey) {
        if (integrationKey == null || integrationKey.isBlank()) throw new IllegalArgumentException("LEARNING_MARKING_SYNC_KEY is required");
        this.mastery = mastery;
        this.integrationKey = integrationKey.getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping
    public ResponseEntity<Void> sync(@RequestHeader(value = "X-Learning-Integration-Key", required = false) String key,
                                     @RequestBody ApprovedMarkingSyncRequest request) {
        if (!matches(key)) throw new IntegrationForbiddenException();
        mastery.applyApprovedMarking(request.toMasteryInput());
        return ResponseEntity.noContent().build();
    }

    private boolean matches(String candidate) {
        return candidate != null && MessageDigest.isEqual(integrationKey, candidate.getBytes(StandardCharsets.UTF_8));
    }

    @ExceptionHandler(IntegrationForbiddenException.class)
    ResponseEntity<ApiError> forbidden() { return error(HttpStatus.FORBIDDEN, "MARKING_SYNC_FORBIDDEN", "Marking sync is not permitted."); }
    @ExceptionHandler({MasteryService.StudentNotFoundException.class, MasteryService.TopicNotFoundException.class})
    ResponseEntity<ApiError> notFound() { return error(HttpStatus.NOT_FOUND, "MARKING_SYNC_CONTEXT_NOT_FOUND", "Marking sync context was not found."); }
    @ExceptionHandler({MasteryService.InvalidResultException.class, IllegalArgumentException.class})
    ResponseEntity<ApiError> invalid(RuntimeException exception) { return error(HttpStatus.BAD_REQUEST, "INVALID_MARKING_SYNC", exception.getMessage()); }

    private ResponseEntity<ApiError> error(HttpStatus status, String code, String message) { return ResponseEntity.status(status).body(new ApiError(code, message, Map.of())); }
    record ApiError(String code, String message, Map<String, String> fields) { }
    static class IntegrationForbiddenException extends RuntimeException { }

    record ApprovedMarkingSyncRequest(
        String eventKey, String state, long revision, long submissionId, long studentId, long tutorUserId,
        long worksheetId, long worksheetQuestionId, long questionBankId, long syllabusTopicId, String syllabusTopicCode,
        java.math.BigDecimal approvedMarks, java.math.BigDecimal maxMarks, LocalDateTime approvedAt,
        List<DiagnosticSyncEvidence> diagnosticEvidence
    ) {
        MasteryService.ApprovedMarking toMasteryInput() {
            MasteryService.State nextState;
            try { nextState = MasteryService.State.valueOf(state); }
            catch (RuntimeException exception) { throw new MasteryService.InvalidResultException("Marking sync state is invalid."); }
            List<DiagnosticSyncEvidence> evidence = diagnosticEvidence == null ? List.of() : diagnosticEvidence;
            return new MasteryService.ApprovedMarking(submissionId, tutorUserId, studentId, syllabusTopicId,
                approvedMarks, maxMarks, Math.toIntExact(revision), nextState, approvedAt,
                evidence.stream().map(item -> item.toMasteryInput(syllabusTopicId)).toList());
        }
    }
    record DiagnosticSyncEvidence(long syllabusTopicId, String category, String description, List<String> missingKeywords) {
        MasteryService.DiagnosticEvidence toMasteryInput(long resultTopicId) {
            if (syllabusTopicId != resultTopicId) throw new MasteryService.InvalidResultException("Diagnostic evidence topic must match the approved result topic.");
            try { return new MasteryService.DiagnosticEvidence(MasteryDiagnosticEvidence.Category.valueOf(category), description, missingKeywords); }
            catch (RuntimeException exception) { throw new MasteryService.InvalidResultException("Diagnostic evidence category is invalid."); }
        }
    }
}
