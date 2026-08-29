package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.service.LearningAuthorizationClient;
import com.fttranscendence.grading.service.MarkingReviewService;
import com.fttranscendence.grading.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.util.Map;

@RestController
@RequestMapping("/api/grading/tutor/reviews")
public class MarkingReviewController {
    private final MarkingReviewService reviews;

    public MarkingReviewController(MarkingReviewService reviews) {
        this.reviews = reviews;
    }

    @PostMapping
    public ResponseEntity<MarkingReviewService.MarkingReview> create(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @RequestBody MarkingReviewService.CreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviews.createAdvisoryReview(user, bearer, request));
    }

    @PostMapping("/manual")
    public ResponseEntity<MarkingReviewService.MarkingReview> createManualResult(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @RequestBody MarkingReviewService.ManualResultRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviews.createManualResult(user, bearer, request));
    }

    @PostMapping("/manual/batch")
    public ResponseEntity<java.util.List<MarkingReviewService.MarkingReview>> createManualResults(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @RequestBody MarkingReviewService.ManualResultBatchRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviews.createManualResults(user, bearer, request));
    }

    @GetMapping("/manual/worksheets/{worksheetId}")
    public MarkingReviewService.ManualResultsResponse listManualResults(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @PathVariable long worksheetId
    ) {
        return reviews.listManualResults(user, bearer, worksheetId);
    }

    @GetMapping("/{submissionId}")
    public MarkingReviewService.MarkingReview get(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @PathVariable long submissionId
    ) {
        return reviews.get(user, bearer, submissionId);
    }

    @PostMapping("/{submissionId}/approve")
    public MarkingReviewService.MarkingReview approve(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @PathVariable long submissionId,
        @RequestBody MarkingReviewService.ApprovalRequest request
    ) {
        return reviews.approve(user, bearer, submissionId, request);
    }

    @PostMapping("/{submissionId}/flag")
    public MarkingReviewService.MarkingReview flag(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @PathVariable long submissionId,
        @RequestBody MarkingReviewService.FlagRequest request
    ) {
        return reviews.flag(user, bearer, submissionId, request);
    }

    @PostMapping("/{submissionId}/reset")
    public MarkingReviewService.MarkingReview reset(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestHeader("Authorization") String bearer,
        @PathVariable long submissionId
    ) {
        return reviews.reset(user, bearer, submissionId);
    }

    @ExceptionHandler(MarkingReviewService.ReviewNotFound.class)
    ResponseEntity<Map<String, String>> notFound() {
        return error(HttpStatus.NOT_FOUND, "REVIEW_NOT_FOUND", "Review was not found.");
    }

    @ExceptionHandler(LearningAuthorizationClient.Forbidden.class)
    ResponseEntity<Map<String, String>> forbidden() {
        return error(HttpStatus.FORBIDDEN, "REVIEW_FORBIDDEN", "You are not allowed to review this submission.");
    }

    @ExceptionHandler(LearningAuthorizationClient.QuestionUnavailable.class)
    ResponseEntity<Map<String, String>> unavailableQuestion() {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "QUESTION_CONTEXT_UNAVAILABLE", "Question context is temporarily unavailable.");
    }

    @ExceptionHandler(LearningAuthorizationClient.ManualResultContextNotFound.class)
    ResponseEntity<Map<String, String>> manualContextNotFound() {
        return error(HttpStatus.NOT_FOUND, "MANUAL_RESULT_CONTEXT_NOT_FOUND", "Worksheet result context was not found.");
    }

    @ExceptionHandler(MarkingReviewService.ManualResultAlreadyExists.class)
    ResponseEntity<Map<String, String>> duplicateManualResult() {
        return error(HttpStatus.CONFLICT, "MANUAL_RESULT_EXISTS", "A manual result already exists for this student and question.");
    }

    @ExceptionHandler(MarkingReviewService.InvalidManualResultRequest.class)
    ResponseEntity<Map<String, String>> invalidManualResult(MarkingReviewService.InvalidManualResultRequest exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_MANUAL_RESULT", exception.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, String>> malformedRequest() {
        return error(HttpStatus.BAD_REQUEST, "INVALID_REVIEW_REQUEST", "Review request contains invalid JSON or values.");
    }

    @ExceptionHandler({MarkingReviewService.InvalidReviewRequest.class, IllegalArgumentException.class})
    ResponseEntity<Map<String, String>> invalidRequest(RuntimeException exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_REVIEW_REQUEST", exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<Map<String, String>> invalidState(IllegalStateException exception) {
        return error(HttpStatus.CONFLICT, "INVALID_REVIEW_STATE", exception.getMessage());
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(Map.of("code", code, "error", message));
    }
}
