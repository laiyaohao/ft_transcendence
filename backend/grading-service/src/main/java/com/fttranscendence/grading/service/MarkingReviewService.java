package com.fttranscendence.grading.service;

import com.fttranscendence.grading.model.AnswerReview;
import com.fttranscendence.grading.model.DiagnosticCategory;
import com.fttranscendence.grading.model.MasterySyncOutbox;
import com.fttranscendence.grading.model.MistakeType;
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
            question.markingCriteria(), question.markingComponents().stream()
                .map(LearningAuthorizationClient.MarkingComponentContext::toRuleComponent).toList(),
            question.keywords(), answer, question.totalMarks());
        submission.recordAiSuggestion(suggestion.suggestedMarks(), suggestion.correctness(), suggestion.errorCategory(),
            suggestion.missingKeywords(), suggestion.feedback());
        submission.nextMasterySyncRevision();
        Submission saved = submissions.saveAndFlush(submission);
        enqueueReviewState(saved, user.userId(), "PENDING_REVIEW");
        return MarkingReview.from(saved, suggestion.providerResponseValid());
    }

    /**
     * Converts a Student-owned OCR document into canonical answer records.
     * The caller supplies only page-to-question associations; Learning supplies
     * the trusted rubric and owning Tutor through the integration boundary.
     */
    @Transactional
    public SubmissionForTutorReviewResponse submitOcrForTutorReview(
        AuthenticatedUser user, long submissionDocumentId, OcrSubmissionRequest request
    ) {
        requirePositive(submissionDocumentId, "Submission document id");
        if (user == null || !"STUDENT".equals(user.role())) throw new LearningAuthorizationClient.Forbidden();
        SubmissionDocument document = documents.findByIdAndOwnerUserIdAndOwnerRole(
            submissionDocumentId, user.userId(), SubmissionDocument.OwnerRole.STUDENT
        ).orElseThrow(ReviewNotFound::new);
        List<Submission> existing = submissions.findBySubmissionDocumentIdOrderByWorksheetQuestionIdAsc(document.getId());
        if (document.getStatus() == SubmissionDocument.Status.SUBMITTED_FOR_REVIEW) {
            if (existing.isEmpty()) throw new IllegalStateException("Submitted document is missing its answer records.");
            return SubmissionForTutorReviewResponse.from(document.getId(), existing);
        }
        if (document.getStatus() != SubmissionDocument.Status.READY) {
            throw new InvalidReviewRequest("The submission document is not ready for review.");
        }
        if (!existing.isEmpty()) {
            throw new IllegalStateException("Ready document already has answer records.");
        }
        List<OcrExtraction> documentExtractions = extractions.findByPageDocumentIdOrderByPagePageNumberAsc(document.getId());
        java.util.Map<Long, Long> mappings = validatedMappings(request, documentExtractions);
        LearningAuthorizationClient.SubmissionMarkingContext context = learning.loadSubmissionMarkingContext(
            user, document.getStudentId(), document.getWorksheetId(), document.getClassId()
        );

        java.util.Map<Long, List<OcrExtraction>> byQuestion = new java.util.LinkedHashMap<>();
        for (OcrExtraction extraction : documentExtractions) {
            Long questionBankId = mappings.get(extraction.getId());
            LearningAuthorizationClient.QuestionContext question = context.questionsByQuestionBankId().get(questionBankId);
            if (question == null) throw new InvalidReviewRequest("Choose a question from this worksheet for every OCR page.");
            extraction.assignToWorksheetQuestion(questionBankId);
            byQuestion.computeIfAbsent(questionBankId, ignored -> new java.util.ArrayList<>()).add(extraction);
        }

        List<Submission> pending = new java.util.ArrayList<>();
        for (var item : byQuestion.entrySet()) {
            LearningAuthorizationClient.QuestionContext question = context.questionsByQuestionBankId().get(item.getKey());
            String answer = item.getValue().stream().map(this::effectiveText)
                .collect(java.util.stream.Collectors.joining("\n\n")).trim();
            if (answer.isBlank()) throw new InvalidReviewRequest("Each mapped OCR page needs corrected text before submission.");
            Submission submission = Submission.createAnswer(document, item.getKey(), item.getKey(), answer,
                question.modelAnswer(), question.totalMarks(), question.syllabusTopicId(), question.syllabusTopicCode());
            AiGradingService.AiMarkingResult suggestion = ai.evaluateMarking(question.prompt(), question.modelAnswer(),
                question.markingCriteria(), question.markingComponents().stream()
                    .map(LearningAuthorizationClient.MarkingComponentContext::toRuleComponent).toList(),
                question.keywords(), answer, question.totalMarks());
            submission.recordAiSuggestion(suggestion.suggestedMarks(), suggestion.correctness(), suggestion.errorCategory(),
                suggestion.missingKeywords(), suggestion.feedback());
            submission.nextMasterySyncRevision();
            pending.add(submission);
        }
        List<Submission> saved = submissions.saveAllAndFlush(pending);
        document.markSubmittedForReview();
        documents.saveAndFlush(document);
        for (Submission submission : saved) enqueueReviewState(submission, context.tutorUserId(), "PENDING_REVIEW");
        return SubmissionForTutorReviewResponse.from(document.getId(), saved);
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
        List<MarkingReview> created = createManualResults(user, bearer, new ManualResultBatchRequest(
            request.worksheetId(), request.studentId(), List.of(new ManualResultEntry(
                request.questionBankId(), request.answer(), request.marks(), request.feedback()
            ))
        ));
        return created.get(0);
    }

    /**
     * Records a selected student's manually entered worksheet marks as one
     * all-or-nothing approval operation. Context, bounds and duplicates are
     * checked for every row before a manual document or submission is written.
     */
    @Transactional
    public List<MarkingReview> createManualResults(
        AuthenticatedUser user,
        String bearer,
        ManualResultBatchRequest request
    ) {
        requirePositiveManual(request.worksheetId(), "Worksheet id");
        requirePositiveManual(request.studentId(), "Student id");
        if (request.entries() == null || request.entries().isEmpty()) {
            throw new InvalidManualResultRequest("Enter at least one question result.");
        }

        var contexts = new java.util.LinkedHashMap<Long, LearningAuthorizationClient.QuestionContext>();
        var normalized = new java.util.ArrayList<ManualResultEntry>();
        for (ManualResultEntry entry : request.entries()) {
            if (entry == null) {
                throw new InvalidManualResultRequest("Each question result is required.");
            }
            requirePositiveManual(entry.questionBankId(), "Question id");
            if (contexts.containsKey(entry.questionBankId())) {
                throw new InvalidManualResultRequest("Each worksheet question may be entered only once.");
            }
            String answer = requireText(entry.answer(), "Student answer");
            String feedback = requireText(entry.feedback(), "Tutor feedback");
            LearningAuthorizationClient.QuestionContext question = learning.validateManualResultContext(
                user, bearer, request.studentId(), request.worksheetId(), entry.questionBankId());
            validateManualScore(entry.marks(), question.totalMarks());
            contexts.put(entry.questionBankId(), question);
            normalized.add(new ManualResultEntry(entry.questionBankId(), answer, entry.marks(), feedback));
        }

        SubmissionDocument document = manualDocument(user.userId(), request.worksheetId(), request.studentId());
        for (ManualResultEntry entry : normalized) {
            if (submissions.findBySubmissionDocumentIdAndWorksheetQuestionId(document.getId(), entry.questionBankId()).isPresent()) {
                throw new ManualResultAlreadyExists();
            }
        }
        try {
            List<Submission> saved = new java.util.ArrayList<>();
            for (ManualResultEntry entry : normalized) {
                LearningAuthorizationClient.QuestionContext question = contexts.get(entry.questionBankId());
                // The Learning worksheet response currently identifies its
                // question instance by question-bank ID. Persist that stable
                // ID on both sides until it exposes a distinct instance ID.
                Submission submission = Submission.createAnswer(document, entry.questionBankId(), entry.questionBankId(),
                    entry.answer(), question.modelAnswer(), question.totalMarks(), question.syllabusTopicId(), question.syllabusTopicCode());
                submission.approve(user.userId(), entry.marks(), entry.feedback());
                submission.nextMasterySyncRevision();
                saved.add(submission);
            }
            List<Submission> persisted = submissions.saveAllAndFlush(saved);
            for (Submission submission : persisted) {
                enqueueMasterySync(submission, user.userId(), "APPROVED");
                enqueueReviewState(submission, user.userId(), "RESOLVED");
            }
            return persisted.stream().map(submission -> MarkingReview.from(submission, null)).toList();
        } catch (DataIntegrityViolationException exception) {
            throw new ManualResultAlreadyExists();
        }
    }

    @Transactional
    public ManualResultsResponse listManualResults(AuthenticatedUser user, String bearer, long worksheetId) {
        requirePositiveManual(worksheetId, "Worksheet id");
        learning.assertCanManageManualResults(user, bearer, worksheetId);
        List<Submission> records = submissions
            .findByWorksheetIdAndSubmissionDocumentOwnerUserIdAndSubmissionDocumentOwnerRoleAndSubmissionDocumentSourceTypeOrderByCreatedAtAsc(
                worksheetId, user.userId(), SubmissionDocument.OwnerRole.TUTOR, SubmissionDocument.SourceType.MANUAL
            );
        java.util.Map<Long, List<MarkingReview>> byStudent = new java.util.LinkedHashMap<>();
        for (Submission record : records) {
            byStudent.computeIfAbsent(record.getStudentId(), ignored -> new java.util.ArrayList<>())
                .add(MarkingReview.from(record, null));
        }
        return new ManualResultsResponse(worksheetId, byStudent.entrySet().stream()
            .map(entry -> new ManualResultStudentProgress(entry.getKey(), entry.getValue().size(), List.copyOf(entry.getValue())))
            .toList());
    }

    @Transactional
    public MarkingReview get(AuthenticatedUser user, String bearer, long submissionId) {
        Submission submission = ownedSubmission(user, bearer, submissionId);
        return MarkingReview.from(submission, null);
    }

    /**
     * Returns a learner-safe, worksheet-scoped view of the latest answer for
     * each worksheet question.  Provisional marking never crosses this
     * boundary: only Tutor approval makes score and feedback final.
     */
    @Transactional
    public StudentResultsResponse studentResults(AuthenticatedUser user, String bearer, long worksheetId) {
        long studentId = learning.resolveStudentWorksheet(user, bearer, worksheetId);
        java.util.Map<Long, StudentResult> latestByQuestion = new java.util.LinkedHashMap<>();
        for (Submission submission : submissions.findByStudentIdAndWorksheetIdOrderByCreatedAtDescIdDesc(studentId, worksheetId)) {
            // The repository is newest-first, so the first row is canonical
            // when a learner resubmits a worksheet question.
            latestByQuestion.putIfAbsent(submission.getWorksheetQuestionId(), StudentResult.from(submission));
        }
        return new StudentResultsResponse(worksheetId, List.copyOf(latestByQuestion.values()));
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

    private static java.util.Map<Long, Long> validatedMappings(
        OcrSubmissionRequest request, List<OcrExtraction> documentExtractions
    ) {
        if (request == null || request.answers() == null || request.answers().size() != documentExtractions.size()
            || documentExtractions.isEmpty()) {
            throw new InvalidReviewRequest("Assign every OCR page to a worksheet question before submitting.");
        }
        java.util.Set<Long> extractionIds = documentExtractions.stream().map(OcrExtraction::getId)
            .collect(java.util.stream.Collectors.toSet());
        java.util.Map<Long, Long> result = new java.util.LinkedHashMap<>();
        for (OcrAnswerMapping mapping : request.answers()) {
            if (mapping == null || mapping.extractionId() == null || mapping.questionBankId() == null
                || mapping.extractionId() <= 0 || mapping.questionBankId() <= 0
                || !extractionIds.contains(mapping.extractionId()) || result.putIfAbsent(mapping.extractionId(), mapping.questionBankId()) != null) {
                throw new InvalidReviewRequest("OCR page mappings are invalid.");
            }
        }
        if (result.size() != extractionIds.size() || documentExtractions.stream()
            .anyMatch(extraction -> extraction.getStatus() != OcrExtraction.Status.READY)) {
            throw new InvalidReviewRequest("Correct all OCR pages and assign each one before submitting.");
        }
        return result;
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
                item.getSyllabusTopicId(), item.getMistakeType(), item.getDescription(), item.getMissingKeywords()
            )).toList();
        }
        return evidence.stream().map(item -> {
            if (item == null || item.mistakeType() == null || item.description() == null || item.description().isBlank()) {
                throw new InvalidReviewRequest("Each diagnostic evidence item requires a mistake type and description.");
            }
            if (item.category() != null && item.category() != item.mistakeType().getDiagnosticCategory()) {
                throw new InvalidReviewRequest("Diagnostic category does not match the selected mistake type.");
            }
            if (item.missingKeywords() != null && item.missingKeywords().stream().anyMatch(
                keyword -> keyword == null || keyword.isBlank()
            )) {
                throw new InvalidReviewRequest("Diagnostic keywords cannot be blank.");
            }
            return new Submission.DiagnosticEvidenceInput(
                submission.getSyllabusTopicId(), item.mistakeType(), item.description(), item.missingKeywords()
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
                || stored.getMistakeType() != incoming.mistakeType()
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
        MasteryProjectionSnapshot snapshot = masteryProjectionSnapshot(submission, state);
        ApprovedMarkingSyncPayload payload = new ApprovedMarkingSyncPayload(
            eventKey, state, revision, submission.getId(), submission.getStudentId(), tutorUserId,
            submission.getWorksheetId(), submission.getWorksheetQuestionId(), submission.getQuestionBankId(),
            submission.getSyllabusTopicId(), submission.getSyllabusTopicCode(), snapshot.approvedMarks(),
            submission.getMaxMarks(), snapshot.approvedAt().toString(),
            "APPROVED".equals(state)
                ? submission.getApprovedDiagnosticEvidence().stream().map(ApprovedMarkingSyncPayload.DiagnosticEvidence::from).toList()
                : List.of()
        );
        try {
            masteryOutbox.saveAndFlush(new MasterySyncOutbox(
                eventKey, MasterySyncOutbox.EventType.APPROVED_MARKING, objectMapper.writeValueAsString(payload)
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize mastery synchronization event", exception);
        }
    }

    /**
     * Retraction happens after the live approved fields have intentionally
     * been cleared.  Its durable event must nevertheless retain the prior
     * Tutor-approved score snapshot so Learning can create or update an
     * inactive projection and suppress a delayed older approval.
     */
    private MasteryProjectionSnapshot masteryProjectionSnapshot(Submission submission, String state) {
        if ("APPROVED".equals(state)) {
            if (submission.getApprovedMarks() == null || submission.getReviewedAt() == null) {
                throw new InvalidReviewRequest("Approved marking is missing its authoritative score snapshot.");
            }
            return new MasteryProjectionSnapshot(submission.getApprovedMarks(), submission.getReviewedAt());
        }
        if (!"RETRACTED".equals(state)) {
            throw new InvalidReviewRequest("Mastery synchronization state is invalid.");
        }
        return submission.getReviews().stream()
            .filter(review -> review.getNewStatus() == Submission.ReviewStatus.APPROVED
                && review.getNewMarks() != null && review.getCreatedAt() != null)
            .max(java.util.Comparator.comparing(AnswerReview::getCreatedAt).thenComparing(AnswerReview::getId,
                java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
            .map(review -> new MasteryProjectionSnapshot(review.getNewMarks(), review.getCreatedAt()))
            .orElseThrow(() -> new InvalidReviewRequest("Retraction is missing its prior approved score snapshot."));
    }

    private void enqueueReviewState(Submission submission, long tutorUserId, String reviewState) {
        long revision = submission.getMasterySyncRevision();
        String eventKey = "review:submission:" + submission.getId() + ":" + revision;
        ReviewStateSyncPayload payload = new ReviewStateSyncPayload(
            eventKey, revision, submission.getId(), tutorUserId, submission.getStudentId(), submission.getWorksheetId(), reviewState,
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
    public record OcrAnswerMapping(Long extractionId, Long questionBankId) { }
    public record OcrSubmissionRequest(List<OcrAnswerMapping> answers) { }
    /** Student-safe confirmation response: it deliberately excludes AI scores and rubric data. */
    public record SubmissionForTutorReviewResponse(Long submissionDocumentId, List<Long> submissionIds, String status) {
        static SubmissionForTutorReviewResponse from(Long documentId, List<Submission> submissions) {
            return new SubmissionForTutorReviewResponse(documentId, submissions.stream().map(Submission::getId).toList(), "PENDING_REVIEW");
        }
    }
    public record ManualResultRequest(
        Long worksheetId,
        Long studentId,
        Long questionBankId,
        String answer,
        BigDecimal marks,
        String feedback
    ) { }
    public record ManualResultEntry(Long questionBankId, String answer, BigDecimal marks, String feedback) { }
    public record ManualResultBatchRequest(Long worksheetId, Long studentId, List<ManualResultEntry> entries) { }
    public record ManualResultStudentProgress(Long studentId, int completedQuestions, List<MarkingReview> results) { }
    public record ManualResultsResponse(Long worksheetId, List<ManualResultStudentProgress> students) { }
    public record StudentResultsResponse(Long worksheetId, List<StudentResult> results) { }
    public record StudentResult(
        Long submissionId,
        Long worksheetQuestionId,
        Long questionBankId,
        String answer,
        String modelAnswer,
        BigDecimal maximumMarks,
        Submission.ReviewStatus reviewStatus,
        StudentResultOutcome outcome,
        BigDecimal awardedMarks,
        String explanation,
        java.time.LocalDateTime reviewedAt
    ) {
        static StudentResult from(Submission submission) {
            if (submission.getReviewStatus() != Submission.ReviewStatus.APPROVED) {
                return new StudentResult(submission.getId(), submission.getWorksheetQuestionId(), submission.getQuestionBankId(),
                    submission.getExtractedAnswer(), null, submission.getMaxMarks(), submission.getReviewStatus(),
                    StudentResultOutcome.REVIEW_NEEDED, null, null, null);
            }
            BigDecimal awarded = submission.getApprovedMarks();
            BigDecimal maximum = submission.getMaxMarks();
            StudentResultOutcome outcome = awarded.compareTo(maximum) == 0
                ? StudentResultOutcome.CORRECT
                : awarded.signum() == 0 ? StudentResultOutcome.INCORRECT : StudentResultOutcome.PARTIAL;
            return new StudentResult(submission.getId(), submission.getWorksheetQuestionId(), submission.getQuestionBankId(),
                submission.getExtractedAnswer(), submission.getModelAnswerSnapshot(), maximum, submission.getReviewStatus(), outcome,
                awarded, submission.getApprovedFeedback(), submission.getReviewedAt());
        }
    }
    public enum StudentResultOutcome { CORRECT, PARTIAL, INCORRECT, REVIEW_NEEDED }
    public record ApprovalRequest(BigDecimal marks, String feedback, List<DiagnosticEvidenceRequest> diagnosticEvidence) {
        public ApprovalRequest(BigDecimal marks, String feedback) { this(marks, feedback, null); }
    }
    public record DiagnosticEvidenceRequest(
        MistakeType mistakeType,
        DiagnosticCategory category,
        String description,
        List<String> missingKeywords
    ) { }
    private record ReviewStateSyncPayload(
        String eventKey, long revision, long submissionId, long tutorUserId, long studentId,
        long worksheetId, String reviewState, String occurredAt
    ) { }
    private record MasteryProjectionSnapshot(BigDecimal approvedMarks, java.time.LocalDateTime approvedAt) { }
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
