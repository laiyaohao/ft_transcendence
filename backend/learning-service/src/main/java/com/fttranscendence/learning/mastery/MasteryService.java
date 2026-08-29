package com.fttranscendence.learning.mastery;

import com.fttranscendence.learning.student.StudentProfile;
import com.fttranscendence.learning.student.StudentProfileRepository;
import com.fttranscendence.learning.syllabus.SyllabusTopic;
import com.fttranscendence.learning.syllabus.SyllabusTopicRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Applies only authoritative Tutor-approved marking results to persisted topic mastery. */
@Service
public class MasteryService {
    private final MasteryRecordRepository records;
    private final StudentProfileRepository students;
    private final SyllabusTopicRepository topics;
    private final MasteryCalculator calculator;
    private final MasteryApprovedResultRepository approvedResults;
    private final MasteryDiagnosticEvidenceRepository evidence;

    public MasteryService(MasteryRecordRepository records, StudentProfileRepository students,
                          SyllabusTopicRepository topics, MasteryCalculator calculator,
                          MasteryApprovedResultRepository approvedResults,
                          MasteryDiagnosticEvidenceRepository evidence) {
        this.records = records; this.students = students; this.topics = topics; this.calculator = calculator;
        this.approvedResults = approvedResults; this.evidence = evidence;
    }

    @Transactional
    public MasteryRecord applyApprovedResult(ApprovedResult result) {
        if (result == null || !result.approved()) throw new UnapprovedResultException();
        return applyApprovedMarking(new ApprovedMarking(
            result.submissionId(), result.tutorId(), null, null, result.studentId(), result.syllabusTopicId(), result.approvedMarks(),
            result.availableMarks(), 1, State.APPROVED, LocalDateTime.now(), List.of()
        ));
    }

    /**
     * Applies a backend-authenticated marking projection.  Approved-result,
     * typed evidence and rebuilt topic mastery are committed in one learning
     * transaction; repeated deliveries and older revisions are harmless.
     */
    @Transactional
    public MasteryRecord applyApprovedMarking(ApprovedMarking input) {
        validate(input);
        StudentProfile student = students.findByIdAndTutorId(input.studentId(), input.tutorId()).orElseThrow(StudentNotFoundException::new);
        SyllabusTopic topic = topics.findById(input.syllabusTopicId()).filter(SyllabusTopic::isActive).orElseThrow(TopicNotFoundException::new);
        MasteryRecord record = records.findByStudentProfileIdAndSyllabusTopicId(student.getId(), topic.getId())
            .orElseGet(() -> records.save(new MasteryRecord(student, topic)));
        MasteryApprovedResult projection = approvedResults.findBySourceSubmissionId(input.submissionId()).orElse(null);
        // Grading emits immutable, monotonically revised events.  A repeated
        // delivery of the same revision must not recalculate derived evidence
        // counts or recreate rows; that is the local idempotency boundary.
        if (projection != null && projection.getRevision() >= input.revision()) return record;
        if (projection != null && (!projection.getStudentProfile().getId().equals(student.getId())
            || !projection.getSyllabusTopic().getId().equals(topic.getId()))) {
            throw new InvalidResultException("An approved result cannot change student or syllabus topic.");
        }

        boolean active = input.state() == State.APPROVED;
        if (projection == null) {
            projection = new MasteryApprovedResult(input.submissionId(), input.tutorId(), input.worksheetId(), input.worksheetQuestionId(), student, topic,
                input.approvedMarks(), input.availableMarks(), 0, input.revision(), active, input.reviewedAt());
        } else if (!active) {
            if (!projection.retract(input.revision())) return record;
        } else if (!projection.replace(input.worksheetId(), input.worksheetQuestionId(), input.approvedMarks(), input.availableMarks(), 0, input.revision(), true, input.reviewedAt())) {
            return record;
        }

        evidence.deleteBySourceSubmissionId(input.submissionId());
        if (active) {
            List<DiagnosticEvidence> diagnostics = input.diagnostics() == null ? List.of() : input.diagnostics();
            for (DiagnosticEvidence diagnostic : diagnostics) {
                MasteryDiagnosticEvidence.MistakeType mistakeType = diagnostic.canonicalMistakeType();
                evidence.save(new MasteryDiagnosticEvidence(record, student, input.tutorId(), input.submissionId(),
                    mistakeType, diagnostic.category(), diagnostic.tutorRationale(), diagnostic.missingKeywords()));
            }
        }
        approvedResults.saveAndFlush(projection);
        rebuild(record, student.getId(), topic.getId());
        return records.save(record);
    }

    private void rebuild(MasteryRecord record, long studentId, long topicId) {
        List<MasteryRecord.ApprovedAttempt> attempts = new ArrayList<>();
        Map<Long, Set<MasteryDiagnosticEvidence.MistakeType>> diagnosticsBySubmission = new HashMap<>();
        for (MasteryDiagnosticEvidence diagnostic : evidence.findByMasteryRecordId(record.getId())) {
            diagnosticsBySubmission.computeIfAbsent(diagnostic.getSourceSubmissionId(), ignored ->
                java.util.EnumSet.noneOf(MasteryDiagnosticEvidence.MistakeType.class)
            ).add(diagnostic.getMistakeType());
        }
        Map<MasteryDiagnosticEvidence.MistakeType, Integer> priorOccurrences =
            new java.util.EnumMap<>(MasteryDiagnosticEvidence.MistakeType.class);
        BigDecimal score = BigDecimal.ZERO.setScale(2);
        int count = 0;
        for (MasteryApprovedResult result : approvedResults.findByStudentProfileIdAndSyllabusTopicIdAndActiveTrueOrderByReviewedAtAscSourceSubmissionIdAsc(studentId, topicId)) {
            Set<MasteryDiagnosticEvidence.MistakeType> mistakeTypes = diagnosticsBySubmission.getOrDefault(result.getSourceSubmissionId(), Set.of());
            int repeated = mistakeTypes.stream().mapToInt(type -> priorOccurrences.getOrDefault(type, 0)).max().orElse(0);
            if (result.getRepeatedMistakeCount() != repeated) {
                result.replace(result.getWorksheetId(), result.getWorksheetQuestionId(), result.getApprovedMarks(), result.getAvailableMarks(),
                    repeated, result.getRevision(), true, result.getReviewedAt());
            }
            MasteryCalculator.Result calculated = calculator.calculate(score, count, result.getApprovedMarks(), result.getAvailableMarks(), repeated)
                .orElseThrow(() -> new InvalidResultException("Approved marks and available marks are required."));
            attempts.add(new MasteryRecord.ApprovedAttempt(calculated.score(), result.getSourceSubmissionId(),
                "Tutor-approved result: " + calculated.adjustedAttemptPercent() + "% attempt evidence"));
            score = calculated.score(); count++;
            mistakeTypes.forEach(type -> priorOccurrences.merge(type, 1, Integer::sum));
        }
        record.replaceApprovedAttempts(attempts);
    }

    private void validate(ApprovedMarking input) {
        if (input == null) throw new InvalidResultException("Approved marking is required.");
        requirePositive(input.submissionId(), "Submission id"); requirePositive(input.tutorId(), "Tutor id"); requirePositive(input.studentId(), "Student id"); requirePositive(input.syllabusTopicId(), "Syllabus topic id");
        if (input.revision() <= 0 || input.state() == null) throw new InvalidResultException("Approved marking revision and state are required.");
        if (input.approvedMarks() == null || input.availableMarks() == null || input.approvedMarks().signum() < 0 || input.availableMarks().signum() <= 0 || input.approvedMarks().compareTo(input.availableMarks()) > 0 || input.approvedMarks().scale() > 2 || input.availableMarks().scale() > 2) throw new InvalidResultException("Approved marks must be between zero and available marks.");
        if (input.reviewedAt() == null) throw new InvalidResultException("Approved marking time is required.");
        List<DiagnosticEvidence> diagnostics = input.diagnostics() == null ? List.of() : input.diagnostics();
        if (input.state() == State.RETRACTED && !diagnostics.isEmpty()) throw new InvalidResultException("Retracted results cannot include diagnostic evidence.");
        diagnostics.forEach(diagnostic -> {
            if (diagnostic == null || diagnostic.tutorRationale() == null || diagnostic.tutorRationale().isBlank()) {
                throw new InvalidResultException("Tutor-confirmed diagnostic evidence is invalid.");
            }
            try { diagnostic.canonicalMistakeType(); }
            catch (IllegalArgumentException exception) { throw new InvalidResultException(exception.getMessage()); }
            // A keyword list is supporting evidence, not a diagnostic type.  For
            // example, a tutor can record a concept weakness and cite the words
            // or phrases the student omitted.  Keep the bounded category while
            // permitting that useful, tutor-confirmed context for every type.
        });
    }

    private static void requirePositive(Long value, String field) { if (value == null || value <= 0) throw new InvalidResultException(field + " must be positive."); }

    public record ApprovedResult(Long submissionId, Long tutorId, Long studentId, Long syllabusTopicId,
                                 BigDecimal approvedMarks, BigDecimal availableMarks, int repeatedMistakeCount,
                                 boolean approved) { }
    public enum State { APPROVED, RETRACTED }
    public record ApprovedMarking(Long submissionId, Long tutorId, Long worksheetId, Long worksheetQuestionId, Long studentId, Long syllabusTopicId,
                                  BigDecimal approvedMarks, BigDecimal availableMarks, int revision, State state,
                                  LocalDateTime reviewedAt, List<DiagnosticEvidence> diagnostics) { }
    /**
     * `mistakeType` is authoritative. `category` is accepted solely for wire
     * compatibility and must agree with the type's derived category. Old
     * producers without a type receive the documented category default.
     */
    public record DiagnosticEvidence(MasteryDiagnosticEvidence.MistakeType mistakeType,
                                     MasteryDiagnosticEvidence.Category category, String tutorRationale,
                                     List<String> missingKeywords) {
        public DiagnosticEvidence(MasteryDiagnosticEvidence.Category category, String tutorRationale,
                                  List<String> missingKeywords) {
            this(null, category, tutorRationale, missingKeywords);
        }

        public MasteryDiagnosticEvidence.MistakeType canonicalMistakeType() {
            if (mistakeType == null) return MasteryDiagnosticEvidence.MistakeType.legacyDefault(category);
            if (category != null && category != mistakeType.category()) {
                throw new IllegalArgumentException("Diagnostic category must match the canonical mistake type.");
            }
            return mistakeType;
        }
    }
    public static class UnapprovedResultException extends RuntimeException { }
    public static class StudentNotFoundException extends RuntimeException { }
    public static class TopicNotFoundException extends RuntimeException { }
    public static class InvalidResultException extends RuntimeException { public InvalidResultException(String message) { super(message); } }
}
