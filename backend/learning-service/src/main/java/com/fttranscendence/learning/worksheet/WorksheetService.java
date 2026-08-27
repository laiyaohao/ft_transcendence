package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.classroom.TutorClassRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class WorksheetService {
    private final WorksheetRepository worksheets;
    private final WorksheetGenerationRequestRepository requests;
    private final TutorClassRepository classes;
    private final StudentProfileRepository students;
    private final SyllabusTopicRepository topics;
    private final QuestionRepository questions;
    private final EntityManager entityManager;

    public WorksheetService(WorksheetRepository worksheets, WorksheetGenerationRequestRepository requests,
            TutorClassRepository classes, StudentProfileRepository students, SyllabusTopicRepository topics,
            QuestionRepository questions, EntityManager entityManager) {
        this.worksheets = worksheets; this.requests = requests; this.classes = classes; this.students = students;
        this.topics = topics; this.questions = questions; this.entityManager = entityManager;
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
        requireClass(tutorId, classId);
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
        List<Question> bank = questions.findDeterministicActiveQuestionBank(normalized.topicIds(), normalized.questionType());
        if (bank.size() < normalized.questionCount()) {
            request.fail("INSUFFICIENT_ACTIVE_QUESTIONS", "The active question bank does not contain enough matching questions.");
            return generationResponse(request, tutorId);
        }
        Worksheet worksheet = new Worksheet();
        worksheet.setTutorId(tutorId);
        worksheet.setCode("GEN-" + request.getId());
        worksheet.setTitle(normalized.title() == null ? "Generated worksheet " + request.getId() : normalized.title());
        worksheet.setInstructions(normalized.instructions());
        worksheet.setAudienceType(normalized.targetMode() == WorksheetGenerationRequest.TargetMode.CLASS
            ? Worksheet.AudienceType.CLASS : Worksheet.AudienceType.STUDENT);
        worksheet.setGenerationRequest(request);
        bank.stream().limit(normalized.questionCount()).forEach(worksheet::addQuestion);
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

    @Transactional
    public WorksheetRequests.WorksheetResponse updateWorksheet(long tutorId, long worksheetId, WorksheetRequests.UpdateWorksheetRequest input) {
        Worksheet worksheet = ownedWorksheet(tutorId, worksheetId);
        if (worksheet.getStatus() != Worksheet.Status.DRAFT) throw new WorksheetNotDraftException();
        if (input.title() != null) worksheet.setTitle(requireText(input.title(), "title"));
        if (input.instructions() != null) worksheet.setInstructions(input.instructions());
        if (input.questionIds() != null) worksheet.replaceQuestions(loadActiveQuestions(input.questionIds()));
        entityManager.flush();
        return WorksheetRequests.WorksheetResponse.from(worksheet);
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
        WorksheetRequests.WorksheetResponse worksheet = worksheets.findByGenerationRequestIdAndTutorId(request.getId(), tutorId)
            .map(WorksheetRequests.WorksheetResponse::from).orElse(null);
        return new WorksheetRequests.GenerationRequestResponse(request.getId(), request.getClassId(), request.getTargetMode(),
            request.getTopicIds(), request.getStudentIds().stream().sorted().toList(), request.getQuestionCount(), request.getQuestionType(),
            request.getDueAt(), request.getStatus(), request.getFailureCode(), request.getFailureMessage(), worksheet);
    }

    private Worksheet ownedWorksheet(long tutorId, long worksheetId) {
        return worksheets.findByIdAndTutorId(worksheetId, tutorId).orElseThrow(WorksheetNotFoundException::new);
    }
    private void requireClass(long tutorId, long classId) { if (classes.findByIdAndTutorId(classId, tutorId).isEmpty()) throw new ClassNotFoundException(); }
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
    private NormalizedGeneration normalize(WorksheetRequests.GenerateWorksheetRequest input) {
        List<Long> topicIds = input.topicIds().stream().distinct().sorted().toList();
        if (topicIds.size() != input.topicIds().size()) throw new InvalidWorksheetRequestException("topicIds must be unique.");
        Set<Long> studentIds = input.studentIds() == null ? Set.of() : new LinkedHashSet<>(input.studentIds());
        if (input.studentIds() != null && studentIds.size() != input.studentIds().size()) throw new InvalidWorksheetRequestException("studentIds must be unique.");
        return new NormalizedGeneration(input.targetMode(), topicIds, input.questionCount(), input.questionType(), input.dueAt(),
            blankToNull(input.title()), blankToNull(input.instructions()), studentIds);
    }
    private String requireIdempotencyKey(String raw) {
        if (raw == null || raw.isBlank() || raw.trim().length() > 128) throw new InvalidWorksheetRequestException("Idempotency-Key is required and may not exceed 128 characters.");
        return raw.trim();
    }
    private String requireText(String value, String field) { if (value.isBlank()) throw new InvalidWorksheetRequestException(field + " must not be blank."); return value.trim(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String requestHash(long classId, NormalizedGeneration value) {
        String canonical = classId + "|" + value.targetMode() + "|" + value.topicIds() + "|" + value.questionCount() + "|" + value.questionType()
            + "|" + value.dueAt() + "|" + value.title() + "|" + value.instructions() + "|" + value.studentIds().stream().sorted().toList();
        try { byte[] bytes = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)); return java.util.HexFormat.of().formatHex(bytes); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException("SHA-256 is unavailable", exception); }
    }
    private record NormalizedGeneration(WorksheetGenerationRequest.TargetMode targetMode, List<Long> topicIds, int questionCount,
        Question.QuestionType questionType, LocalDateTime dueAt, String title, String instructions, Set<Long> studentIds) { }

    public static class ClassNotFoundException extends RuntimeException { }
    public static class WorksheetNotFoundException extends RuntimeException { }
    public static class GenerationRequestNotFoundException extends RuntimeException { }
    public static class IdempotencyConflictException extends RuntimeException { }
    public static class WorksheetNotDraftException extends RuntimeException { }
    public static class WorksheetNotGeneratedException extends RuntimeException { }
    public static class InvalidWorksheetRequestException extends RuntimeException { public InvalidWorksheetRequestException(String message) { super(message); } }
}
