package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.classroom.TutorClass;
import com.fttranscendence.learning.classroom.TutorClassRepository;
import com.fttranscendence.learning.alert.MarkingReviewStatusProjection;
import com.fttranscendence.learning.alert.MarkingReviewStatusProjectionRepository;
import com.fttranscendence.learning.mastery.MasteryApprovedResult;
import com.fttranscendence.learning.mastery.MasteryApprovedResultRepository;
import com.fttranscendence.learning.question.Question;
import com.fttranscendence.learning.question.QuestionRepository;
import com.fttranscendence.learning.student.StudentProfile;
import com.fttranscendence.learning.student.StudentProfileRepository;
import com.fttranscendence.learning.syllabus.SyllabusTopicRepository;
import jakarta.persistence.EntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

@Service
public class WorksheetService {
    private final WorksheetRepository worksheets;
    private final WorksheetGenerationRequestRepository requests;
    private final TutorClassRepository classes;
    private final StudentProfileRepository students;
    private final SyllabusTopicRepository topics;
    private final QuestionRepository questions;
    private final MasteryApprovedResultRepository approvedResults;
    private final MarkingReviewStatusProjectionRepository reviewStates;
    private final EntityManager entityManager;

    public WorksheetService(WorksheetRepository worksheets, WorksheetGenerationRequestRepository requests,
            TutorClassRepository classes, StudentProfileRepository students, SyllabusTopicRepository topics,
            QuestionRepository questions, MasteryApprovedResultRepository approvedResults,
            MarkingReviewStatusProjectionRepository reviewStates, EntityManager entityManager) {
        this.worksheets = worksheets; this.requests = requests; this.classes = classes; this.students = students;
        this.topics = topics; this.questions = questions; this.approvedResults = approvedResults;
        this.reviewStates = reviewStates; this.entityManager = entityManager;
    }

    @Transactional
    public WorksheetRequests.GenerationRequestResponse generate(long tutorId, long classId, String idempotencyKey,
            WorksheetRequests.GenerateWorksheetRequest input) {
        String key = requireIdempotencyKey(idempotencyKey);
        NormalizedGeneration normalized = normalize(input);
        String hash = requestHash(classId, normalized);
        var existing = requests.findByTutorIdAndIdempotencyKey(tutorId, key);
        if (existing.isPresent()) {
            if (!existing.get().getRequestHash().equals(hash)) throw new IdempotencyConflictException();
            return generationResponse(existing.get(), tutorId);
        }
        TutorClass tutorClass = ownedClass(tutorId, classId);
        requireTopics(normalized.topicIds());
        Set<Long> members = validateTargets(tutorId, classId, normalized.targetMode(), normalized.studentIds());
        WorksheetGenerationRequest request = new WorksheetGenerationRequest(tutorId, classId, normalized.targetMode(),
            normalized.questionCount(), normalized.questionType(), normalized.dueAt(), key, hash, normalized.topicIds(), members);
        try {
            requests.save(request);
            entityManager.flush(); // request id is the immutable worksheet provenance and code suffix.
        } catch (DataIntegrityViolationException exception) {
            WorksheetGenerationRequest winner = requests.findByTutorIdAndIdempotencyKey(tutorId, key).orElseThrow(() -> exception);
            if (!winner.getRequestHash().equals(hash)) throw new IdempotencyConflictException();
            return generationResponse(winner, tutorId);
        }
        request.start();
        List<Question> selected = selectBalancedQuestions(normalized.topicIds(), normalized.questionCount(), normalized.questionType());
        if (selected.size() != normalized.questionCount()) {
            request.fail("INSUFFICIENT_ACTIVE_QUESTIONS", "The active question bank does not contain enough matching questions.");
            return generationResponse(request, tutorId);
        }
        Worksheet worksheet = new Worksheet();
        worksheet.setTutorId(tutorId);
        worksheet.setCode("GEN-" + request.getId());
        worksheet.setTitle(normalized.title() == null ? "Generated worksheet " + request.getId() : normalized.title());
        worksheet.setInstructions(normalized.instructions());
        worksheet.setSubject(tutorClass.getSubject());
        worksheet.setWorksheetType(normalized.worksheetType());
        worksheet.setAudienceType(normalized.targetMode() == WorksheetGenerationRequest.TargetMode.CLASS
            ? Worksheet.AudienceType.CLASS : Worksheet.AudienceType.STUDENT);
        worksheet.setGenerationRequest(request);
        selected.forEach(worksheet::addQuestion);
        worksheets.save(worksheet);
        request.succeed();
        entityManager.flush();
        return generationResponse(request, tutorId);
    }

    @Transactional(readOnly = true)
    public WorksheetRequests.GenerationRequestResponse getGenerationRequest(long tutorId, long classId, long requestId) {
        requireClass(tutorId, classId);
        WorksheetGenerationRequest request = requests.findByIdAndTutorId(requestId, tutorId).orElseThrow(GenerationRequestNotFoundException::new);
        if (!request.getClassId().equals(classId)) throw new GenerationRequestNotFoundException();
        return generationResponse(request, tutorId);
    }

    @Transactional(readOnly = true)
    public WorksheetRequests.WorksheetResponse getWorksheet(long tutorId, long worksheetId) {
        return WorksheetRequests.WorksheetResponse.from(ownedWorksheet(tutorId, worksheetId));
    }

    @Transactional(readOnly = true)
    public List<WorksheetRequests.WorksheetResponse> listWorksheets(long tutorId, Long classId) {
        List<Worksheet> owned = classId == null
            ? worksheets.findAllByTutorIdWithAssignments(tutorId)
            : classWorksheets(tutorId, classId);
        return owned.stream().map(WorksheetRequests.WorksheetResponse::from).toList();
    }

    /**
     * Lists only the authenticated Student's approved assignments.  Completion
     * and scores are based exclusively on protected Tutor-approved projections;
     * the service never reads AI suggestions or raw answers from grading.
     */
    @Transactional(readOnly = true)
    public List<WorksheetRequests.StudentWorksheetLibraryItem> listStudentWorksheets(
            long loginUserId, StudentWorksheetFilter filter) {
        StudentProfile student = students.findByLoginUserId(loginUserId).orElseThrow(StudentWorksheetNotFoundException::new);
        StudentWorksheetFilter normalized = normalizeStudentFilter(filter);
        Map<Long, com.fttranscendence.learning.syllabus.SyllabusTopic> allTopics = topics
            .findAllByActiveTrueOrderByDepthAscSortOrderAscCodeAsc().stream()
            .collect(java.util.stream.Collectors.toMap(com.fttranscendence.learning.syllabus.SyllabusTopic::getId, value -> value));
        validateLibraryTaxonomy(normalized, allTopics);

        return worksheets.findApprovedAssignedToStudentWithQuestions(student.getId()).stream()
            .map(worksheet -> studentLibraryItem(student, worksheet, normalized, allTopics))
            .filter(java.util.Objects::nonNull)
            .toList();
    }

    @Transactional
    public WorksheetRequests.WorksheetResponse updateWorksheet(long tutorId, long worksheetId, WorksheetRequests.UpdateWorksheetRequest input) {
        Worksheet worksheet = ownedWorksheet(tutorId, worksheetId);
        if (worksheet.getStatus() != Worksheet.Status.DRAFT) throw new WorksheetNotDraftException();
        if (input.title() != null) worksheet.setTitle(requireText(input.title(), "title"));
        if (input.instructions() != null) worksheet.setInstructions(input.instructions());
        if (input.questionIds() != null) {
            /*
             * `(worksheet_id, position)` is deliberately unique. A normal
             * JPA list reorder updates rows one at a time, so a swap can
             * transiently collide with the row that still owns the target
             * position. Draft questions have no approved-result dependency;
             * replace their join rows within this transaction, then recreate
             * the ordered aggregate.
             */
            replaceDraftQuestions(worksheet, input.questionIds());
            worksheet = ownedWorksheet(tutorId, worksheetId);
        }
        entityManager.flush();
        return WorksheetRequests.WorksheetResponse.from(worksheet);
    }

    private void replaceDraftQuestions(Worksheet worksheet, List<Long> questionIds) {
        List<Long> requestedIds = List.copyOf(questionIds);
        // Validate before deleting so an invalid request leaves the draft unchanged.
        loadActiveQuestions(requestedIds);
        entityManager.flush();
        entityManager.createNativeQuery("DELETE FROM worksheet_questions WHERE worksheet_id = :worksheetId")
            .setParameter("worksheetId", worksheet.getId())
            .executeUpdate();
        entityManager.clear();

        Worksheet refreshed = ownedWorksheet(worksheet.getTutorId(), worksheet.getId());
        refreshed.replaceQuestions(loadActiveQuestions(requestedIds));
    }

    @Transactional
    public WorksheetRequests.WorksheetResponse approveAndAssign(long tutorId, long worksheetId,
            WorksheetRequests.ApproveWorksheetRequest input) {
        Worksheet worksheet = ownedWorksheet(tutorId, worksheetId);
        if (worksheet.getStatus() == Worksheet.Status.APPROVED) return WorksheetRequests.WorksheetResponse.from(worksheet);
        if (worksheet.getStatus() != Worksheet.Status.DRAFT) throw new WorksheetNotDraftException();
        Long requestId = worksheet.getGenerationRequestId();
        if (requestId == null) throw new WorksheetNotGeneratedException();
        WorksheetGenerationRequest request = requests.findByIdAndTutorId(requestId, tutorId).orElseThrow(GenerationRequestNotFoundException::new);
        LocalDateTime dueAt = input.dueAt() == null ? request.getDueAt() : input.dueAt();
        if (dueAt != null && !dueAt.isAfter(LocalDateTime.now())) throw new InvalidWorksheetRequestException("dueAt must be in the future.");
        requireClass(tutorId, request.getClassId());
        if (request.getTargetMode() == WorksheetGenerationRequest.TargetMode.CLASS) {
            worksheet.approve();
            worksheet.assignToClass(request.getClassId(), dueAt);
        } else {
            Set<Long> memberIds = validateTargets(tutorId, request.getClassId(), request.getTargetMode(), request.getStudentIds());
            worksheet.approve();
            memberIds.stream().sorted().forEach(studentId -> worksheet.assignToStudent(studentId, dueAt));
        }
        entityManager.flush();
        return WorksheetRequests.WorksheetResponse.from(worksheet);
    }

    private WorksheetRequests.GenerationRequestResponse generationResponse(WorksheetGenerationRequest request, long tutorId) {
        WorksheetRequests.WorksheetResponse worksheet = worksheets.findByGenerationRequest_IdAndTutorId(request.getId(), tutorId)
            .map(WorksheetRequests.WorksheetResponse::from).orElse(null);
        return new WorksheetRequests.GenerationRequestResponse(request.getId(), request.getClassId(), request.getTargetMode(),
            request.getTopicIds(), request.getStudentIds().stream().sorted().toList(), request.getQuestionCount(), request.getQuestionType(),
            request.getDueAt(), request.getStatus(), request.getFailureCode(), request.getFailureMessage(), worksheet);
    }

    private WorksheetRequests.StudentWorksheetLibraryItem studentLibraryItem(StudentProfile student, Worksheet worksheet,
            StudentWorksheetFilter filter, Map<Long, com.fttranscendence.learning.syllabus.SyllabusTopic> allTopics) {
        WorksheetAssignment assignment = effectiveAssignment(student, worksheet);
        if (assignment == null || !matchesAssignedDate(assignment, filter)) return null;
        List<com.fttranscendence.learning.syllabus.SyllabusTopic> worksheetTopics = worksheet.getQuestions().stream()
            .map(question -> question.getQuestion().getSyllabusTopic()).distinct()
            .sorted(Comparator.comparing(com.fttranscendence.learning.syllabus.SyllabusTopic::getName)
                .thenComparing(com.fttranscendence.learning.syllabus.SyllabusTopic::getId))
            .toList();
        List<com.fttranscendence.learning.syllabus.SyllabusTopic> subjects = worksheetTopics.stream()
            .map(topic -> subjectOf(topic, allTopics)).filter(java.util.Objects::nonNull).distinct()
            .sorted(Comparator.comparing(com.fttranscendence.learning.syllabus.SyllabusTopic::getName)
                .thenComparing(com.fttranscendence.learning.syllabus.SyllabusTopic::getId))
            .toList();
        if (filter.subjectId() != null && subjects.stream().noneMatch(subject -> subject.getId().equals(filter.subjectId()))) return null;
        if (filter.topicId() != null && worksheetTopics.stream().noneMatch(topic -> topic.getId().equals(filter.topicId()))) return null;

        List<MasteryApprovedResult> results = approvedResults
            .findByStudentProfileIdAndWorksheetIdAndActiveTrueOrderByReviewedAtAscSourceSubmissionIdAsc(student.getId(), worksheet.getId());
        List<MarkingReviewStatusProjection> reviews = reviewStates
            .findByStudentProfileIdAndWorksheetIdOrderByRequestedAtAscSourceSubmissionIdAsc(student.getId(), worksheet.getId());
        LibraryOutcome outcome = outcome(worksheet, results, reviews);
        if (filter.status() != null && outcome.status() != filter.status()) return null;
        return new WorksheetRequests.StudentWorksheetLibraryItem(worksheet.getId(), worksheet.getCode(), worksheet.getTitle(),
            summaries(subjects), summaries(worksheetTopics), assignment.getAssignedAt(), assignment.getDueAt(),
            outcome.status(), outcome.submittedAt(), outcome.reviewedAt(), outcome.score());
    }

    private WorksheetAssignment effectiveAssignment(StudentProfile student, Worksheet worksheet) {
        Set<Long> classIds = student.getMemberships().stream().map(com.fttranscendence.learning.student.ClassMembership::getClassId).collect(java.util.stream.Collectors.toSet());
        return worksheet.getAssignments().stream()
            .filter(assignment -> (assignment.getAssignmentType() == Worksheet.AudienceType.STUDENT && student.getId().equals(assignment.getStudentProfileId()))
                || (assignment.getAssignmentType() == Worksheet.AudienceType.CLASS && classIds.contains(assignment.getClassId())))
            .max(Comparator.comparing(WorksheetAssignment::getAssignedAt).thenComparing(WorksheetAssignment::getId))
            .orElse(null);
    }

    private LibraryOutcome outcome(Worksheet worksheet, List<MasteryApprovedResult> results,
            List<MarkingReviewStatusProjection> reviews) {
        // Grading publishes the question-bank id in the legacy worksheetQuestionId
        // projection field. It never has the worksheet_questions join-row id, so
        // completion must be evaluated in the same question-bank-id namespace.
        Set<Long> questionBankIds = worksheet.getQuestions().stream()
            .map(worksheetQuestion -> worksheetQuestion.getQuestion().getId())
            .collect(java.util.stream.Collectors.toSet());
        Map<Long, MasteryApprovedResult> latestByQuestionBankId = new HashMap<>();
        for (MasteryApprovedResult result : results) {
            Long questionBankId = result.getWorksheetQuestionId();
            if (questionBankId != null && questionBankIds.contains(questionBankId)) {
                latestByQuestionBankId.put(questionBankId, result);
            }
        }
        LocalDateTime submittedAt = reviews.stream().map(MarkingReviewStatusProjection::getRequestedAt).min(LocalDateTime::compareTo).orElse(null);
        LocalDateTime reviewedAt = results.stream().map(MasteryApprovedResult::getReviewedAt).max(LocalDateTime::compareTo).orElse(null);
        if (!questionBankIds.isEmpty() && latestByQuestionBankId.keySet().containsAll(questionBankIds)) {
            BigDecimal awarded = latestByQuestionBankId.values().stream().map(MasteryApprovedResult::getApprovedMarks).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal available = latestByQuestionBankId.values().stream().map(MasteryApprovedResult::getAvailableMarks).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (available.signum() > 0) return new LibraryOutcome(WorksheetRequests.StudentWorksheetStatus.MARKED,
                submittedAt, reviewedAt, new WorksheetRequests.ScoreSummary(awarded, available,
                    awarded.multiply(BigDecimal.valueOf(100)).divide(available, 2, RoundingMode.HALF_UP)));
        }
        if (!reviews.isEmpty() || !results.isEmpty()) return new LibraryOutcome(WorksheetRequests.StudentWorksheetStatus.SUBMITTED, submittedAt, reviewedAt, null);
        return new LibraryOutcome(WorksheetRequests.StudentWorksheetStatus.ASSIGNED, null, null, null);
    }

    private List<WorksheetRequests.TopicSummary> summaries(List<com.fttranscendence.learning.syllabus.SyllabusTopic> values) {
        return values.stream().map(topic -> new WorksheetRequests.TopicSummary(topic.getId(), topic.getName())).toList();
    }

    private com.fttranscendence.learning.syllabus.SyllabusTopic subjectOf(com.fttranscendence.learning.syllabus.SyllabusTopic start,
            Map<Long, com.fttranscendence.learning.syllabus.SyllabusTopic> allTopics) {
        com.fttranscendence.learning.syllabus.SyllabusTopic current = start;
        Set<Long> seen = new java.util.HashSet<>();
        while (current != null && seen.add(current.getId())) {
            if (current.getNodeType() == com.fttranscendence.learning.syllabus.SyllabusTopic.NodeType.SUBJECT) return current;
            current = current.getParentId() == null ? null : allTopics.get(current.getParentId());
        }
        return null;
    }

    private StudentWorksheetFilter normalizeStudentFilter(StudentWorksheetFilter filter) {
        StudentWorksheetFilter value = filter == null ? new StudentWorksheetFilter(null, null, null, null, null) : filter;
        if (value.subjectId() != null && value.subjectId() <= 0) throw new InvalidStudentWorksheetFilterException("subjectId must be positive.");
        if (value.topicId() != null && value.topicId() <= 0) throw new InvalidStudentWorksheetFilterException("topicId must be positive.");
        if (value.assignedFrom() != null && value.assignedTo() != null && value.assignedFrom().isAfter(value.assignedTo())) throw new InvalidStudentWorksheetFilterException("assignedFrom must not be after assignedTo.");
        return value;
    }

    private void validateLibraryTaxonomy(StudentWorksheetFilter filter, Map<Long, com.fttranscendence.learning.syllabus.SyllabusTopic> allTopics) {
        if (filter.subjectId() != null && (allTopics.get(filter.subjectId()) == null || allTopics.get(filter.subjectId()).getNodeType() != com.fttranscendence.learning.syllabus.SyllabusTopic.NodeType.SUBJECT)) throw new InvalidStudentWorksheetFilterException("subjectId must identify an active subject.");
        if (filter.topicId() != null && (allTopics.get(filter.topicId()) == null || (allTopics.get(filter.topicId()).getNodeType() != com.fttranscendence.learning.syllabus.SyllabusTopic.NodeType.TOPIC && allTopics.get(filter.topicId()).getNodeType() != com.fttranscendence.learning.syllabus.SyllabusTopic.NodeType.SUBTOPIC))) throw new InvalidStudentWorksheetFilterException("topicId must identify an active topic or subtopic.");
    }

    private boolean matchesAssignedDate(WorksheetAssignment assignment, StudentWorksheetFilter filter) {
        LocalDate date = assignment.getAssignedAt().toLocalDate();
        return (filter.assignedFrom() == null || !date.isBefore(filter.assignedFrom()))
            && (filter.assignedTo() == null || !date.isAfter(filter.assignedTo()));
    }

    private Worksheet ownedWorksheet(long tutorId, long worksheetId) {
        return worksheets.findByIdAndTutorId(worksheetId, tutorId).orElseThrow(WorksheetNotFoundException::new);
    }
    private List<Worksheet> classWorksheets(long tutorId, long classId) {
        requireClass(tutorId, classId);
        return worksheets.findClassAssignedWorksheetsByTutorId(tutorId, classId);
    }
    private TutorClass ownedClass(long tutorId, long classId) {
        return classes.findByIdAndTutorId(classId, tutorId).orElseThrow(ClassNotFoundException::new);
    }
    private void requireClass(long tutorId, long classId) { ownedClass(tutorId, classId); }
    private void requireTopics(List<Long> topicIds) {
        if (topics.findAllById(topicIds).size() != topicIds.size()) throw new InvalidWorksheetRequestException("Every topicId must exist.");
    }
    private Set<Long> validateTargets(long tutorId, long classId, WorksheetGenerationRequest.TargetMode mode, Set<Long> requested) {
        if (mode == WorksheetGenerationRequest.TargetMode.CLASS) {
            if (!requested.isEmpty()) throw new InvalidWorksheetRequestException("studentIds are only valid for STUDENTS targets.");
            return Set.of();
        }
        if (requested.isEmpty()) throw new InvalidWorksheetRequestException("Choose at least one student target.");
        Set<Long> members = students.findAllByTutorIdAndClassIdOrderByFullNameAsc(tutorId, classId).stream()
            .map(StudentProfile::getId).collect(java.util.stream.Collectors.toSet());
        if (!members.containsAll(requested)) throw new InvalidWorksheetRequestException("Every target student must be an active member of this class.");
        return Set.copyOf(requested);
    }
    private List<Question> loadActiveQuestions(List<Long> requestedIds) {
        if (new LinkedHashSet<>(requestedIds).size() != requestedIds.size()) throw new InvalidWorksheetRequestException("questionIds must be unique.");
        List<Question> loaded = new ArrayList<>();
        for (Long id : requestedIds) loaded.add(questions.findById(id).filter(q -> q.getArchiveState() == Question.ArchiveState.ACTIVE)
            .orElseThrow(() -> new InvalidWorksheetRequestException("Every questionId must be active in the question bank.")));
        return loaded;
    }

    /**
     * Selects a deterministic, even mix across every requested topic.  A topic
     * cannot be silently dropped merely because another topic has a large bank.
     * Remainder questions go to topic ids in canonical order, which makes a retry
     * reproducible and keeps the request idempotency hash meaningful.
     */
    private List<Question> selectBalancedQuestions(List<Long> topicIds, int questionCount,
            Question.QuestionType questionType) {
        if (questionCount < topicIds.size()) {
            return List.of();
        }
        Map<Long, List<Question>> byTopic = new HashMap<>();
        for (Question question : questions.findDeterministicActiveQuestionBank(topicIds, questionType)) {
            byTopic.computeIfAbsent(question.getSyllabusTopic().getId(), ignored -> new ArrayList<>()).add(question);
        }
        int base = questionCount / topicIds.size();
        int remainder = questionCount % topicIds.size();
        List<Question> selected = new ArrayList<>(questionCount);
        for (int index = 0; index < topicIds.size(); index++) {
            int required = base + (index < remainder ? 1 : 0);
            List<Question> candidates = byTopic.getOrDefault(topicIds.get(index), List.of());
            if (candidates.size() < required) {
                return List.of();
            }
            selected.addAll(candidates.subList(0, required));
        }
        return selected;
    }
    private NormalizedGeneration normalize(WorksheetRequests.GenerateWorksheetRequest input) {
        List<Long> topicIds = input.topicIds().stream().distinct().sorted().toList();
        if (topicIds.size() != input.topicIds().size()) throw new InvalidWorksheetRequestException("topicIds must be unique.");
        if (input.questionCount() < topicIds.size()) {
            throw new InvalidWorksheetRequestException("questionCount must be at least the number of selected topics.");
        }
        Set<Long> studentIds = input.studentIds() == null ? Set.of() : new LinkedHashSet<>(input.studentIds());
        if (input.studentIds() != null && studentIds.size() != input.studentIds().size()) throw new InvalidWorksheetRequestException("studentIds must be unique.");
        Worksheet.WorksheetType worksheetType = input.worksheetType() == null
            ? Worksheet.WorksheetType.STANDARD : input.worksheetType();
        return new NormalizedGeneration(input.targetMode(), topicIds, input.questionCount(), input.questionType(), input.dueAt(),
            blankToNull(input.title()), blankToNull(input.instructions()), studentIds, worksheetType);
    }
    private String requireIdempotencyKey(String raw) {
        if (raw == null || raw.isBlank() || raw.trim().length() > 128) throw new InvalidWorksheetRequestException("Idempotency-Key is required and may not exceed 128 characters.");
        return raw.trim();
    }
    private String requireText(String value, String field) { if (value.isBlank()) throw new InvalidWorksheetRequestException(field + " must not be blank."); return value.trim(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String requestHash(long classId, NormalizedGeneration value) {
        String canonical = classId + "|" + value.targetMode() + "|" + value.topicIds() + "|" + value.questionCount() + "|" + value.questionType() + "|" + value.worksheetType()
            + "|" + value.dueAt() + "|" + value.title() + "|" + value.instructions() + "|" + value.studentIds().stream().sorted().toList();
        try { byte[] bytes = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)); return java.util.HexFormat.of().formatHex(bytes); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException("SHA-256 is unavailable", exception); }
    }
    private record NormalizedGeneration(WorksheetGenerationRequest.TargetMode targetMode, List<Long> topicIds, int questionCount,
        Question.QuestionType questionType, LocalDateTime dueAt, String title, String instructions, Set<Long> studentIds,
        Worksheet.WorksheetType worksheetType) { }
    public record StudentWorksheetFilter(Long subjectId, Long topicId, WorksheetRequests.StudentWorksheetStatus status,
                                         LocalDate assignedFrom, LocalDate assignedTo) { }
    private record LibraryOutcome(WorksheetRequests.StudentWorksheetStatus status, LocalDateTime submittedAt,
                                  LocalDateTime reviewedAt, WorksheetRequests.ScoreSummary score) { }

    public static class ClassNotFoundException extends RuntimeException { }
    public static class WorksheetNotFoundException extends RuntimeException { }
    public static class GenerationRequestNotFoundException extends RuntimeException { }
    public static class IdempotencyConflictException extends RuntimeException { }
    public static class WorksheetNotDraftException extends RuntimeException { }
    public static class WorksheetNotGeneratedException extends RuntimeException { }
    public static class StudentWorksheetNotFoundException extends RuntimeException { }
    public static class InvalidStudentWorksheetFilterException extends RuntimeException { public InvalidStudentWorksheetFilterException(String message) { super(message); } }
    public static class InvalidWorksheetRequestException extends RuntimeException { public InvalidWorksheetRequestException(String message) { super(message); } }
}
