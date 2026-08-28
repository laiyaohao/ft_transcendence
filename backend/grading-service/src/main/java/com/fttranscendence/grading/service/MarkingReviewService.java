package com.fttranscendence.grading.service;

import com.fttranscendence.grading.model.AnswerReview;
import com.fttranscendence.grading.model.DiagnosticCategory;
import com.fttranscendence.grading.model.MasterySyncOutbox;
import com.fttranscendence.grading.model.Submission;
import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.ocr.OcrExtraction;
import com.fttranscendence.grading.repository.OcrExtractionRepository;
import com.fttranscendence.grading.repository.SubmissionDocumentRepository;
import com.fttranscendence.grading.repository.SubmissionRepository;
import com.fttranscendence.grading.repository.MasterySyncOutboxRepository;
import com.fttranscendence.grading.security.AuthenticatedUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/** Coordinates advisory marking while keeping final marks behind Tutor approval. */
@Service
public class MarkingReviewService {
    private final SubmissionRepository submissions;
    private final SubmissionDocumentRepository documents;
    private final OcrExtractionRepository extractions;
    private final LearningAuthorizationClient learning;
    private final AiGradingService ai;
    private final MasterySyncOutboxRepository masteryOutbox;
    private final ObjectMapper objectMapper;

    public MarkingReviewService(
        SubmissionRepository submissions,
        SubmissionDocumentRepository documents,
        OcrExtractionRepository extractions,
        LearningAuthorizationClient learning,
        AiGradingService ai,
        MasterySyncOutboxRepository masteryOutbox,
        ObjectMapper objectMapper
    ) {
        this.submissions = submissions;
        this.documents = documents;
        this.extractions = extractions;
        this.learning = learning;
        this.ai = ai;
        this.masteryOutbox = masteryOutbox;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MarkingReview createAdvisoryReview(
        AuthenticatedUser user, String bearer, CreateRequest request
    ) {
        requirePositive(request.submissionDocumentId(), "Submission document id");
        requirePositive(request.worksheetQuestionId(), "Worksheet question id");
        requirePositive(request.questionBankId(), "Question bank id");
        SubmissionDocument document = documents.findById(request.submissionDocumentId())
            .orElseThrow(ReviewNotFound::new);
        if (document.getStatus() != SubmissionDocument.Status.READY) {
            throw new InvalidReviewRequest("The submission document is not ready for review.");
        }
        learning.assertCanReview(user, bearer, document.getStudentId());
        LearningAuthorizationClient.QuestionContext question = learning.loadQuestion(user, bearer, request.questionBankId());
        if (question.totalMarks().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidReviewRequest("Question maximum marks must be positive.");
        }

        List<OcrExtraction> questionExtractions = extractions.findByPageDocumentIdOrderByPagePageNumberAsc(document.getId())
            .stream().filter(extraction -> request.worksheetQuestionId().equals(extraction.getWorksheetQuestionId())).toList();
        if (questionExtractions.isEmpty()) {
            throw new InvalidReviewRequest("No OCR text is associated with this worksheet question.");
        }
        String answer = questionExtractions.stream().map(this::effectiveText)
            .filter(text -> !text.isBlank()).collect(java.util.stream.Collectors.joining("\n\n"));

        Submission submission = Submission.createAnswer(document, request.worksheetQuestionId(), request.questionBankId(),
            answer, question.modelAnswer(), question.totalMarks(), question.syllabusTopicId(), question.syllabusTopicCode());
        AiGradingService.AiMarkingResult suggestion = ai.evaluateMarking(question.prompt(), question.modelAnswer(),
            question.markingCriteria(), question.keywords(), answer, question.totalMarks());
        submission.recordAiSuggestion(suggestion.suggestedMarks(), suggestion.correctness(), suggestion.errorCategory(),
            suggestion.missingKeywords(), suggestion.feedback());
        submission.nextMasterySyncRevision();
        Submission saved = submissions.saveAndFlush(submission);
        enqueueReviewState(saved, user.userId(), "PENDING_REVIEW");
        return MarkingReview.from(saved, suggestion.providerResponseValid());
    }

    /**
     * Persists a Tutor-entered result through the same canonical submission,
     * approval, score-boundary and audit-history path as an OCR review.
     */
    @Transactional
    public MarkingReview createManualResult(
        AuthenticatedUser user,
        String bearer,
        ManualResultRequest request
    ) {
        requirePositiveManual(request.worksheetId(), "Worksheet id");
        requirePositiveManual(request.studentId(), "Student id");
        requirePositiveManual(request.questionBankId(), "Question bank id");
        String answer = requireText(request.answer(), "Student answer");
        String feedback = requireText(request.feedback(), "Tutor feedback");
        LearningAuthorizationClient.QuestionContext question = learning.validateManualResultContext(
            user, bearer, request.studentId(), request.worksheetId(), request.questionBankId());
        validateManualScore(request.marks(), question.totalMarks());

        SubmissionDocument document = manualDocument(user.userId(), request.worksheetId(), request.studentId());
        if (submissions.findBySubmissionDocumentIdAndWorksheetQuestionId(document.getId(), request.questionBankId()).isPresent()) {
            throw new ManualResultAlreadyExists();
        }
        try {
            // Learning currently exposes question-bank IDs in worksheet detail.
            // Store that same authoritative ID in worksheetQuestionId until its
            // cross-service question-instance identifier is exposed.
            Submission submission = Submission.createAnswer(document, request.questionBankId(), request.questionBankId(),
                answer, question.modelAnswer(), question.totalMarks(), question.syllabusTopicId(), question.syllabusTopicCode());
            submission.approve(user.userId(), request.marks(), feedback);
            submission.nextMasterySyncRevision();
            Submission saved = submissions.saveAndFlush(submission);
            enqueueMasterySync(saved, user.userId(), "APPROVED");
            enqueueReviewState(saved, user.userId(), "RESOLVED");
            return MarkingReview.from(saved, null);
        } catch (DataIntegrityViolationException exception) {
            throw new ManualResultAlreadyExists();
        }
    }

    @Transactional
    public MarkingReview get(AuthenticatedUser user, String bearer, long submissionId) {
        Submission submission = ownedSubmission(user, bearer, submissionId);
        return MarkingReview.from(submission, null);
    }

    @Transactional
    public MarkingReview approve(AuthenticatedUser user, String bearer, long submissionId, ApprovalRequest request) {
        Submission submission = ownedSubmission(user, bearer, submissionId);
        BigDecimal marks = request.marks();
        String feedback = request.feedback();
        boolean wasApproved = submission.getReviewStatus() == Submission.ReviewStatus.APPROVED;
        List<Submission.DiagnosticEvidenceInput> requestedEvidence = diagnosticInputs(submission, request.diagnosticEvidence());
        boolean evidenceSpecified = request.diagnosticEvidence() != null;
        if (submission.getReviewStatus() == Submission.ReviewStatus.APPROVED
            && marks != null && marks.compareTo(submission.getApprovedMarks()) == 0
            && feedback != null && feedback.trim().equals(submission.getApprovedFeedback())
            && (!evidenceSpecified || sameDiagnosticEvidence(submission, requestedEvidence))) {
            return MarkingReview.from(submission, null);
        }
        submission.approve(user.userId(), marks, feedback);
        if (evidenceSpecified || !wasApproved) {
            submission.replaceApprovedDiagnosticEvidence(requestedEvidence);
        } else if (submission.getApprovedDiagnosticEvidence().isEmpty()) {
            submission.replaceApprovedDiagnosticEvidence(List.of());
        }
        submission.nextMasterySyncRevision();
        Submission saved = submissions.saveAndFlush(submission);
        enqueueMasterySync(saved, user.userId(), "APPROVED");
        enqueueReviewState(saved, user.userId(), "RESOLVED");
        return MarkingReview.from(saved, null);
    }

    @Transactional
    public MarkingReview flag(AuthenticatedUser user, String bearer, long submissionId, FlagRequest request) {
        Submission submission = ownedSubmission(user, bearer, submissionId);
        boolean wasApproved = submission.getReviewStatus() == Submission.ReviewStatus.APPROVED;
        submission.flagForLater(user.userId(), request.reason());
        if (wasApproved) submission.nextMasterySyncRevision();
        Submission saved = submissions.saveAndFlush(submission);
        if (wasApproved) {
            enqueueMasterySync(saved, user.userId(), "RETRACTED");
            enqueueReviewState(saved, user.userId(), "PENDING_REVIEW");
        }
        return MarkingReview.from(saved, null);
    }

    @Transactional
    public MarkingReview reset(AuthenticatedUser user, String bearer, long submissionId) {
        Submission submission = ownedSubmission(user, bearer, submissionId);
        boolean wasApproved = submission.getReviewStatus() == Submission.ReviewStatus.APPROVED;
        submission.resetToAiSuggestion(user.userId());
        if (wasApproved) submission.nextMasterySyncRevision();
        Submission saved = submissions.saveAndFlush(submission);
        if (wasApproved) {
            enqueueMasterySync(saved, user.userId(), "RETRACTED");
            enqueueReviewState(saved, user.userId(), "PENDING_REVIEW");
        }
        return MarkingReview.from(saved, null);
    }

    private Submission ownedSubmission(AuthenticatedUser user, String bearer, long submissionId) {
        requirePositive(submissionId, "Submission id");
        Submission submission = submissions.findById(submissionId).orElseThrow(ReviewNotFound::new);
        learning.assertCanReview(user, bearer, submission.getStudentId());
        return submission;
    }

    private SubmissionDocument manualDocument(long tutorId, long worksheetId, long studentId) {
        return documents.findByOwnerUserIdAndOwnerRoleAndWorksheetIdAndStudentIdAndSourceType(
            tutorId,
            SubmissionDocument.OwnerRole.TUTOR,
            worksheetId,
            studentId,
            SubmissionDocument.SourceType.MANUAL
        ).orElseGet(() -> {
            SubmissionDocument created = new SubmissionDocument(
                tutorId,
                SubmissionDocument.OwnerRole.TUTOR,
                worksheetId,
                studentId,
                SubmissionDocument.SourceType.MANUAL
            );
            created.markReady();
            try {
                return documents.saveAndFlush(created);
            } catch (DataIntegrityViolationException exception) {
                return documents.findByOwnerUserIdAndOwnerRoleAndWorksheetIdAndStudentIdAndSourceType(
                    tutorId,
                    SubmissionDocument.OwnerRole.TUTOR,
                    worksheetId,
                    studentId,
                    SubmissionDocument.SourceType.MANUAL
                ).orElseThrow(() -> exception);
            }
        });
    }

    private String effectiveText(OcrExtraction extraction) {
        String corrected = extraction.getCorrectedText();
        return corrected != null && !corrected.isBlank() ? corrected : extraction.getExtractedText();
    }

    private static void requirePositive(Long value, String field) {
        if (value == null || value <= 0) {
            throw new InvalidReviewRequest(field + " must be positive.");
        }
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidManualResultRequest(field + " is required.");
        }
        return value.trim();
    }

    private static void requirePositiveManual(Long value, String field) {
        if (value == null || value <= 0) {
            throw new InvalidManualResultRequest(field + " must be positive.");
        }
    }

    private static void validateManualScore(BigDecimal marks, BigDecimal maximum) {
        if (marks == null) {
            throw new InvalidManualResultRequest("Marks are required.");
        }
        try {
            BigDecimal normalized = marks.setScale(2);
            if (normalized.signum() < 0 || normalized.compareTo(maximum) > 0) {
                throw new InvalidManualResultRequest("Marks must be between zero and the question maximum.");
            }
        } catch (ArithmeticException exception) {
            throw new InvalidManualResultRequest("Marks may have at most two decimal places.");
        }
    }

    private List<Submission.DiagnosticEvidenceInput> diagnosticInputs(
        Submission submission, List<DiagnosticEvidenceRequest> evidence
    ) {
        if (evidence == null) {
            return submission.getApprovedDiagnosticEvidence().stream().map(item -> new Submission.DiagnosticEvidenceInput(
                item.getSyllabusTopicId(), item.getCategory(), item.getDescription(), item.getMissingKeywords()
            )).toList();
        }
        return evidence.stream().map(item -> {
            if (item == null || item.category() == null || item.description() == null || item.description().isBlank()) {
                throw new InvalidReviewRequest("Each diagnostic evidence item requires a category and description.");
            }
            if (item.missingKeywords() != null && item.missingKeywords().stream().anyMatch(
                keyword -> keyword == null || keyword.isBlank()
            )) {
                throw new InvalidReviewRequest("Diagnostic keywords cannot be blank.");
            }
            return new Submission.DiagnosticEvidenceInput(
                submission.getSyllabusTopicId(), item.category(), item.description(), item.missingKeywords()
            );
        }).toList();
    }

    private static boolean sameDiagnosticEvidence(Submission submission, List<Submission.DiagnosticEvidenceInput> requested) {
        List<com.fttranscendence.grading.model.ApprovedDiagnosticEvidence> existing = submission.getApprovedDiagnosticEvidence();
        if (existing.size() != requested.size()) return false;
        for (int index = 0; index < existing.size(); index++) {
            var stored = existing.get(index);
            var incoming = requested.get(index);
            if (!stored.getSyllabusTopicId().equals(incoming.syllabusTopicId())
                || stored.getCategory() != incoming.category()
                || !stored.getDescription().equals(incoming.description().trim())
                || !stored.getMissingKeywords().equals(normalizeKeywords(incoming.missingKeywords()))) return false;
        }
        return true;
    }

    private static List<String> normalizeKeywords(List<String> values) {
        if (values == null) return List.of();
        return values.stream().filter(java.util.Objects::nonNull).map(String::trim)
            .filter(value -> !value.isBlank()).distinct().toList();
    }

    private void enqueueMasterySync(Submission submission, long tutorUserId, String state) {
        if (submission.getSyllabusTopicId() == null || submission.getSyllabusTopicCode() == null) {
            throw new InvalidReviewRequest("The question is missing its syllabus topic context.");
        }
        long revision = submission.getMasterySyncRevision();
        String eventKey = "mastery:submission:" + submission.getId() + ":" + revision;
        ApprovedMarkingSyncPayload payload = new ApprovedMarkingSyncPayload(
            eventKey, state, revision, submission.getId(), submission.getStudentId(), tutorUserId,
            submission.getWorksheetId(), submission.getWorksheetQuestionId(), submission.getQuestionBankId(),
            submission.getSyllabusTopicId(), submission.getSyllabusTopicCode(), submission.getApprovedMarks(),
            submission.getMaxMarks(), submission.getReviewedAt() == null ? null : submission.getReviewedAt().toString(),
            submission.getApprovedDiagnosticEvidence().stream().map(ApprovedMarkingSyncPayload.DiagnosticEvidence::from).toList()
        );
        try {
            masteryOutbox.saveAndFlush(new MasterySyncOutbox(
                eventKey, MasterySyncOutbox.EventType.APPROVED_MARKING, objectMapper.writeValueAsString(payload)
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize mastery synchronization event", exception);
        }
    }

    private void enqueueReviewState(Submission submission, long tutorUserId, String reviewState) {
        long revision = submission.getMasterySyncRevision();
        String eventKey = "review:submission:" + submission.getId() + ":" + revision;
        ReviewStateSyncPayload payload = new ReviewStateSyncPayload(
            eventKey, revision, submission.getId(), tutorUserId, submission.getStudentId(), reviewState,
            ("PENDING_REVIEW".equals(reviewState) ? submission.getCreatedAt() : submission.getReviewedAt()).toString()
        );
        try {
            masteryOutbox.saveAndFlush(new MasterySyncOutbox(
                eventKey, MasterySyncOutbox.EventType.MARKING_REVIEW_STATE, objectMapper.writeValueAsString(payload)
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize review synchronization event", exception);
        }
    }

    public record CreateRequest(Long submissionDocumentId, Long worksheetQuestionId, Long questionBankId) { }
    public record ManualResultRequest(
        Long worksheetId,
        Long studentId,
        Long questionBankId,
        String answer,
        BigDecimal marks,
        String feedback
    ) { }
    public record ApprovalRequest(BigDecimal marks, String feedback, List<DiagnosticEvidenceRequest> diagnosticEvidence) {
        public ApprovalRequest(BigDecimal marks, String feedback) { this(marks, feedback, null); }
    }
    public record DiagnosticEvidenceRequest(
        DiagnosticCategory category,
        String description,
        List<String> missingKeywords
    ) { }
    private record ReviewStateSyncPayload(
        String eventKey, long revision, long submissionId, long tutorUserId, long studentId,
        String reviewState, String occurredAt
    ) { }
    public record FlagRequest(String reason) { }

    public record MarkingReview(
        Long id,
        Long studentId,
        Long worksheetId,
        Long worksheetQuestionId,
        Long questionBankId,
        String extractedAnswer,
        String modelAnswer,
        BigDecimal maxMarks,
        BigDecimal aiSuggestedMarks,
        String aiSuggestedOutcome,
        String aiErrorCategory,
        List<String> missingKeywords,
        String aiSuggestedFeedback,
        Submission.ReviewStatus reviewStatus,
        BigDecimal approvedMarks,
        String approvedFeedback,
        Long reviewedByUserId,
        java.time.LocalDateTime reviewedAt,
        Boolean providerResponseValid,
        List<ApprovedMarkingSyncPayload.DiagnosticEvidence> diagnosticEvidence,
        List<ReviewHistory> history
    ) {
        static MarkingReview from(Submission submission, Boolean providerResponseValid) {
            return new MarkingReview(submission.getId(), submission.getStudentId(), submission.getWorksheetId(),
                submission.getWorksheetQuestionId(), submission.getQuestionBankId(), submission.getExtractedAnswer(),
                submission.getModelAnswerSnapshot(), submission.getMaxMarks(), submission.getAiSuggestedMarks(),
                submission.getAiSuggestedOutcome(), submission.getAiErrorCategory(), submission.getMissingKeywords(),
                submission.getAiSuggestedFeedback(), submission.getReviewStatus(), submission.getApprovedMarks(),
                submission.getApprovedFeedback(), submission.getReviewedByUserId(), submission.getReviewedAt(), providerResponseValid,
                submission.getApprovedDiagnosticEvidence().stream().map(ApprovedMarkingSyncPayload.DiagnosticEvidence::from).toList(),
                submission.getReviews().stream().map(ReviewHistory::from).toList());
        }
    }

    public record ReviewHistory(
        Long id, AnswerReview.Action action, Long reviewerUserId, Submission.ReviewStatus previousStatus,
        Submission.ReviewStatus newStatus, BigDecimal previousMarks, BigDecimal newMarks,
        String previousFeedback, String newFeedback, java.time.LocalDateTime createdAt
    ) {
        static ReviewHistory from(AnswerReview review) {
            return new ReviewHistory(review.getId(), review.getAction(), review.getReviewerUserId(), review.getPreviousStatus(),
                review.getNewStatus(), review.getPreviousMarks(), review.getNewMarks(), review.getPreviousFeedback(),
                review.getNewFeedback(), review.getCreatedAt());
        }
    }

    public static class ReviewNotFound extends RuntimeException { }
    public static class InvalidReviewRequest extends RuntimeException {
        public InvalidReviewRequest(String message) { super(message); }
    }
    public static class InvalidManualResultRequest extends RuntimeException {
        public InvalidManualResultRequest(String message) { super(message); }
    }
    public static class ManualResultAlreadyExists extends RuntimeException { }
}
