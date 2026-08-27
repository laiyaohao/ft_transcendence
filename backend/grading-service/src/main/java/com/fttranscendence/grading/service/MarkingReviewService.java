package com.fttranscendence.grading.service;

import com.fttranscendence.grading.model.AnswerReview;
import com.fttranscendence.grading.model.Submission;
import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.ocr.OcrExtraction;
import com.fttranscendence.grading.repository.OcrExtractionRepository;
import com.fttranscendence.grading.repository.SubmissionDocumentRepository;
import com.fttranscendence.grading.repository.SubmissionRepository;
import com.fttranscendence.grading.security.AuthenticatedUser;
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

    public MarkingReviewService(
        SubmissionRepository submissions,
        SubmissionDocumentRepository documents,
        OcrExtractionRepository extractions,
        LearningAuthorizationClient learning,
        AiGradingService ai
    ) {
        this.submissions = submissions;
        this.documents = documents;
        this.extractions = extractions;
        this.learning = learning;
        this.ai = ai;
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
            answer, question.modelAnswer(), question.totalMarks());
        AiGradingService.AiMarkingResult suggestion = ai.evaluateMarking(question.prompt(), question.modelAnswer(),
            question.markingCriteria(), question.keywords(), answer, question.totalMarks());
        submission.recordAiSuggestion(suggestion.suggestedMarks(), suggestion.correctness(), suggestion.errorCategory(),
            suggestion.missingKeywords(), suggestion.feedback());
        return MarkingReview.from(submissions.saveAndFlush(submission), suggestion.providerResponseValid());
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
                answer, question.modelAnswer(), question.totalMarks());
            submission.approve(user.userId(), request.marks(), feedback);
            return MarkingReview.from(submissions.saveAndFlush(submission), null);
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
        if (submission.getReviewStatus() == Submission.ReviewStatus.APPROVED
            && marks != null && marks.compareTo(submission.getApprovedMarks()) == 0
            && feedback != null && feedback.trim().equals(submission.getApprovedFeedback())) {
            return MarkingReview.from(submission, null);
        }
        submission.approve(user.userId(), marks, feedback);
        return MarkingReview.from(submissions.saveAndFlush(submission), null);
    }

    @Transactional
    public MarkingReview flag(AuthenticatedUser user, String bearer, long submissionId, FlagRequest request) {
        Submission submission = ownedSubmission(user, bearer, submissionId);
        submission.flagForLater(user.userId(), request.reason());
        return MarkingReview.from(submissions.saveAndFlush(submission), null);
    }

    @Transactional
    public MarkingReview reset(AuthenticatedUser user, String bearer, long submissionId) {
        Submission submission = ownedSubmission(user, bearer, submissionId);
        submission.resetToAiSuggestion(user.userId());
        return MarkingReview.from(submissions.saveAndFlush(submission), null);
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

    public record CreateRequest(Long submissionDocumentId, Long worksheetQuestionId, Long questionBankId) { }
    public record ManualResultRequest(
        Long worksheetId,
        Long studentId,
        Long questionBankId,
        String answer,
        BigDecimal marks,
        String feedback
    ) { }
    public record ApprovalRequest(BigDecimal marks, String feedback) { }
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
        List<ReviewHistory> history
    ) {
        static MarkingReview from(Submission submission, Boolean providerResponseValid) {
            return new MarkingReview(submission.getId(), submission.getStudentId(), submission.getWorksheetId(),
                submission.getWorksheetQuestionId(), submission.getQuestionBankId(), submission.getExtractedAnswer(),
                submission.getModelAnswerSnapshot(), submission.getMaxMarks(), submission.getAiSuggestedMarks(),
                submission.getAiSuggestedOutcome(), submission.getAiErrorCategory(), submission.getMissingKeywords(),
                submission.getAiSuggestedFeedback(), submission.getReviewStatus(), submission.getApprovedMarks(),
                submission.getApprovedFeedback(), submission.getReviewedByUserId(), submission.getReviewedAt(), providerResponseValid,
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
