package com.fttranscendence.learning.security;

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

/** Backend-only authorization boundary for grading document uploads. */
@RestController
@RequestMapping("/api/learning/internal/submission-authorization")
public class SubmissionAuthorizationController {
    private final DomainAuthorizationService authorization;
    private final byte[] integrationKey;

    public SubmissionAuthorizationController(DomainAuthorizationService authorization,
                                             @Value("${learning.marking-sync-key}") String integrationKey) {
        if (integrationKey == null || integrationKey.isBlank()) {
            throw new IllegalArgumentException("LEARNING_MARKING_SYNC_KEY is required");
        }
        this.authorization = authorization;
        this.integrationKey = integrationKey.getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping
    public ResponseEntity<Void> authorize(
        @RequestHeader(value = "X-Learning-Integration-Key", required = false) String key,
        @RequestBody SubmissionContext request
    ) {
        if (!matches(key)) throw new IntegrationForbiddenException();
        if (request == null || request.actorUserId() <= 0 || request.studentId() <= 0 || request.worksheetId() <= 0) {
            throw new DomainAuthorizationService.ResourceNotFoundException();
        }
        DomainAuthorizationService.ActorRole role;
        try { role = DomainAuthorizationService.ActorRole.valueOf(request.actorRole()); }
        catch (RuntimeException exception) { throw new DomainAuthorizationService.ResourceNotFoundException(); }
        authorization.requireSubmissionContext(request.actorUserId(), role, request.studentId(), request.worksheetId(), request.worksheetQuestionId(), request.classId());
        return ResponseEntity.noContent().build();
    }

    /** Gives grading a server-only worksheet rubric after the same scope check used for uploads. */
    @PostMapping("/marking-context")
    public DomainAuthorizationService.SubmissionMarkingContext markingContext(
        @RequestHeader(value = "X-Learning-Integration-Key", required = false) String key,
        @RequestBody SubmissionContext request
    ) {
        if (!matches(key)) throw new IntegrationForbiddenException();
        if (request == null || request.actorUserId() <= 0 || request.studentId() <= 0 || request.worksheetId() <= 0) {
            throw new DomainAuthorizationService.ResourceNotFoundException();
        }
        DomainAuthorizationService.ActorRole role;
        try { role = DomainAuthorizationService.ActorRole.valueOf(request.actorRole()); }
        catch (RuntimeException exception) { throw new DomainAuthorizationService.ResourceNotFoundException(); }
        return authorization.requireSubmissionMarkingContext(
            request.actorUserId(), role, request.studentId(), request.worksheetId(), request.classId()
        );
    }

    private boolean matches(String candidate) {
        return candidate != null && MessageDigest.isEqual(integrationKey, candidate.getBytes(StandardCharsets.UTF_8));
    }

    @ExceptionHandler(IntegrationForbiddenException.class)
    ResponseEntity<ApiError> forbidden() {
        return error(HttpStatus.FORBIDDEN, "SUBMISSION_AUTHORIZATION_FORBIDDEN", "Submission authorization is not permitted.");
    }

    @ExceptionHandler(DomainAuthorizationService.ResourceNotFoundException.class)
    ResponseEntity<ApiError> notFound() {
        return error(HttpStatus.NOT_FOUND, "SUBMISSION_CONTEXT_NOT_FOUND", "Submission context was not found.");
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new ApiError(code, message));
    }

    record SubmissionContext(long actorUserId, String actorRole, long studentId, long worksheetId,
                             Long worksheetQuestionId, Long classId) { }
    record ApiError(String code, String message) { }
    static class IntegrationForbiddenException extends RuntimeException { }
}
