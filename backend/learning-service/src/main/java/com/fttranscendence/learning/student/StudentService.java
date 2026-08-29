package com.fttranscendence.learning.student;

import com.fttranscendence.learning.classroom.TutorClass;
import com.fttranscendence.learning.classroom.TutorClassRepository;
import com.fttranscendence.learning.alert.TutorAlert;
import com.fttranscendence.learning.alert.TutorAlertRepository;
import com.fttranscendence.learning.mastery.MasteryHistory;
import com.fttranscendence.learning.mastery.MasteryApprovedResultRepository;
import com.fttranscendence.learning.mastery.MasteryRecord;
import com.fttranscendence.learning.mastery.MasteryRecordRepository;
import com.fttranscendence.learning.report.ProgressReport;
import com.fttranscendence.learning.report.ProgressReportRepository;
import com.fttranscendence.learning.worksheet.Worksheet;
import com.fttranscendence.learning.worksheet.WorksheetAssignment;
import com.fttranscendence.learning.worksheet.WorksheetRepository;
import jakarta.persistence.EntityManager;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class StudentService {

    private final StudentProfileRepository students;
    private final TutorClassRepository classes;
    private final EntityManager entityManager;
    private final MasteryRecordRepository masteryRecords;
    private final MasteryApprovedResultRepository approvedResults;
    private final WorksheetRepository worksheets;
    private final TutorAlertRepository alerts;
    private final ProgressReportRepository reports;

    public StudentService(
        StudentProfileRepository students,
        TutorClassRepository classes,
        EntityManager entityManager,
        MasteryRecordRepository masteryRecords,
        MasteryApprovedResultRepository approvedResults,
        WorksheetRepository worksheets,
        TutorAlertRepository alerts,
        ProgressReportRepository reports
    ) {
        this.students = students;
        this.classes = classes;
        this.entityManager = entityManager;
        this.masteryRecords = masteryRecords;
        this.approvedResults = approvedResults;
        this.worksheets = worksheets;
        this.alerts = alerts;
        this.reports = reports;
    }

    @Transactional(readOnly = true)
    public List<StudentRequest.StudentResponse> listOwnedStudents(long tutorId, Long classId) {
        requireTutor(tutorId);
        if (classId != null) {
            requireOwnedClass(tutorId, classId);
        }
        List<StudentProfile> profiles = classId == null
            ? students.findAllByTutorIdOrderByFullNameAsc(tutorId)
            : students.findAllByTutorIdAndClassIdOrderByFullNameAsc(tutorId, classId);
        Map<Long, TutorClass> classesById = ownedClassMap(tutorId);
        return profiles.stream()
            .map(profile -> StudentRequest.StudentResponse.from(profile, classesById))
            .toList();
    }

    @Transactional(readOnly = true)
    public StudentRequest.StudentResponse getOwnedStudent(long tutorId, long studentId) {
        requireTutor(tutorId);
        StudentProfile student = requireOwnedStudent(tutorId, studentId);
        return StudentRequest.StudentResponse.from(student, ownedClassMap(tutorId));
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getOwnedStudentProfile(long tutorId, long studentId) {
        requireTutor(tutorId);
        StudentProfile student = students.findByIdAndTutorId(studentId, tutorId)
            .orElseThrow(ProfileNotFoundException::new);
        return profileResponse(student, true);
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getLinkedStudentProfile(long loginUserId) {
        if (loginUserId <= 0) {
            throw new ProfileNotFoundException();
        }
        StudentProfile student = students.findByLoginUserId(loginUserId)
            .orElseThrow(ProfileNotFoundException::new);
        return profileResponse(student, false);
    }

    @Transactional
    public StudentRequest.StudentResponse create(long tutorId, StudentRequest request) {
        requireTutor(tutorId);
        validateRequest(request);
        Map<Long, TutorClass> requestedClasses = resolveRequestedClasses(tutorId, request.classIds());
        ensureLoginIdentityAvailable(request.loginUserId(), null);

        StudentProfile student = new StudentProfile();
        student.setTutorId(tutorId);
        apply(student, request, requestedClasses);
        try {
            StudentProfile saved = students.save(student);
            entityManager.flush();
            return StudentRequest.StudentResponse.from(saved, requestedClasses);
        } catch (DataIntegrityViolationException exception) {
            throw conflictFor(request, exception);
        } catch (DataAccessException exception) {
            throw new StudentPersistenceException(exception);
        }
    }

    @Transactional
    public StudentRequest.StudentResponse update(long tutorId, long studentId, StudentRequest request) {
        requireTutor(tutorId);
        validateRequest(request);
        StudentProfile student = requireOwnedStudent(tutorId, studentId);
        Map<Long, TutorClass> requestedClasses = resolveRequestedClasses(tutorId, request.classIds());
        ensureLoginIdentityAvailable(request.loginUserId(), studentId);

        apply(student, request, requestedClasses);
        try {
            entityManager.flush();
            return StudentRequest.StudentResponse.from(student, requestedClasses);
        } catch (DataIntegrityViolationException exception) {
            throw conflictFor(request, exception);
        } catch (DataAccessException exception) {
            throw new StudentPersistenceException(exception);
        }
    }

    private void apply(
        StudentProfile student,
        StudentRequest request,
        Map<Long, TutorClass> requestedClasses
    ) {
        student.setFullName(request.fullName().trim());
        student.setLoginUserId(request.loginUserId());

        Set<Long> wantedIds = requestedClasses.keySet();
        new ArrayList<>(student.getMemberships()).stream()
            .filter(membership -> !wantedIds.contains(membership.getClassId()))
            .forEach(student::removeClassMembership);
        Set<Long> currentIds = student.getMemberships().stream()
            .map(ClassMembership::getClassId)
            .collect(java.util.stream.Collectors.toSet());
        wantedIds.stream()
            .filter(classId -> !currentIds.contains(classId))
            .sorted()
            .forEach(student::addClassMembership);
    }

    private Map<Long, TutorClass> resolveRequestedClasses(long tutorId, List<Long> classIds) {
        Set<Long> uniqueIds = new HashSet<>();
        for (Long classId : classIds) {
            if (!uniqueIds.add(classId)) {
                throw new DuplicateMembershipException(classId);
            }
        }
        Map<Long, TutorClass> owned = ownedClassMap(tutorId);
        for (Long classId : uniqueIds) {
            if (!owned.containsKey(classId)) {
                throw new ClassNotFoundException(classId);
            }
        }
        return owned.entrySet().stream()
            .filter(entry -> uniqueIds.contains(entry.getKey()))
            .sorted(Map.Entry.comparingByKey())
            .collect(java.util.stream.Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (left, right) -> left,
                java.util.LinkedHashMap::new
            ));
    }

    private Map<Long, TutorClass> ownedClassMap(long tutorId) {
        Map<Long, TutorClass> result = new HashMap<>();
        for (TutorClass tutorClass : classes.findAllByTutorIdOrderByClassNameAsc(tutorId)) {
            result.put(tutorClass.getId(), tutorClass);
        }
        return result;
    }

    private StudentProfileResponse profileResponse(StudentProfile student, boolean includeTutorOnly) {
        List<MasteryRecord> records = masteryRecords
            .findProfileRecordsByStudentProfileIdWithTopicAndHistory(student.getId());
        Map<Long, TutorClass> classMap = ownedClassMap(student.getTutorId());
        List<StudentProfileResponse.ClassSummary> classResponses = student.getMemberships().stream()
            .map(ClassMembership::getClassId)
            .map(classMap::get)
            .filter(java.util.Objects::nonNull)
            .map(item -> new StudentProfileResponse.ClassSummary(
                item.getId(), item.getClassName(), item.getSubject(), item.getLevel(), item.getStatus()))
            .sorted(Comparator.comparing(StudentProfileResponse.ClassSummary::className,
                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                .thenComparing(StudentProfileResponse.ClassSummary::id))
            .toList();

        BigDecimal total = records.stream().map(MasteryRecord::getScore)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        int attempts = records.stream().mapToInt(MasteryRecord::getAttemptCount).sum();
        LocalDateTime lastCalculatedAt = records.stream().map(MasteryRecord::getCalculatedAt)
            .filter(java.util.Objects::nonNull)
            .max(LocalDateTime::compareTo)
            .orElse(null);
        StudentProfileResponse.Metrics metrics = new StudentProfileResponse.Metrics(
            records.isEmpty() ? null : average(total, records.size()), records.size(), attempts, lastCalculatedAt);
        List<StudentProfileResponse.MasteryTopic> mastery = records.stream()
            .map(record -> new StudentProfileResponse.MasteryTopic(
                record.getSyllabusTopic().getId(), record.getSyllabusTopic().getCode(),
                record.getSyllabusTopic().getName(), record.getScore(), record.getMasteryStatus(),
                record.getAttemptCount(), record.getCalculatedAt()))
            .toList();
        List<StudentProfileResponse.TopicSummary> strengths = records.stream()
            .filter(record -> record.getScore().compareTo(new BigDecimal("85.00")) >= 0)
            .map(this::topicSummary)
            .sorted(Comparator.comparing(StudentProfileResponse.TopicSummary::score).reversed()
                .thenComparing(StudentProfileResponse.TopicSummary::topicName)
                .thenComparing(StudentProfileResponse.TopicSummary::topicId))
            .toList();
        List<StudentProfileResponse.TopicSummary> focusAreas = records.stream()
            .filter(record -> record.getScore().compareTo(new BigDecimal("70.00")) < 0
                || record.getMasteryStatus() == MasteryRecord.MasteryStatus.NEEDS_REVISION)
            .map(this::topicSummary)
            .sorted(Comparator.comparing(StudentProfileResponse.TopicSummary::score)
                .thenComparing(StudentProfileResponse.TopicSummary::topicName)
                .thenComparing(StudentProfileResponse.TopicSummary::topicId))
            .toList();
        List<StudentProfileResponse.HistoryItem> history = records.stream()
            .flatMap(record -> record.getHistory().stream().map(item -> historyItem(record, item)))
            .sorted(Comparator.comparing(StudentProfileResponse.HistoryItem::occurredAt,
                Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(StudentProfileResponse.HistoryItem::topicId))
            .limit(50)
            .toList();

        List<StudentProfileResponse.WorksheetAssignmentSummary> worksheetAssignments = effectiveWorksheets(
            student, classResponses.stream().map(StudentProfileResponse.ClassSummary::id).toList());
        StudentProfileResponse.TutorOnly tutorOnly = includeTutorOnly
            ? tutorOnly(student)
            : null;
        return new StudentProfileResponse(student.getId(), student.getFullName(), classResponses,
            metrics, mastery, new StudentProfileResponse.LearningProfile(strengths, focusAreas),
            history, worksheetAssignments, tutorOnly);
    }

    private List<StudentProfileResponse.WorksheetAssignmentSummary> effectiveWorksheets(
        StudentProfile student,
        List<Long> classIds
    ) {
        List<StudentProfileResponse.WorksheetAssignmentSummary> result = new ArrayList<>();
        for (Worksheet worksheet : worksheets.findApprovedStudentAssignedWorksheetsByTutorId(
            student.getTutorId(), student.getId())) {
            worksheet.getAssignments().stream()
                .filter(assignment -> assignment.getAssignmentType() == Worksheet.AudienceType.STUDENT)
                .filter(assignment -> student.getId().equals(assignment.getStudentProfileId()))
                .forEach(assignment -> result.add(assignmentSummary(worksheet, assignment)));
        }
        for (Long classId : classIds) {
            for (Worksheet worksheet : worksheets.findClassAssignedWorksheetsByTutorId(student.getTutorId(), classId)) {
                if (worksheet.getStatus() != Worksheet.Status.APPROVED) continue;
                worksheet.getAssignments().stream()
                    .filter(assignment -> assignment.getAssignmentType() == Worksheet.AudienceType.CLASS)
                    .filter(assignment -> classId.equals(assignment.getClassId()))
                    .forEach(assignment -> result.add(assignmentSummary(worksheet, assignment)));
            }
        }
        return result.stream()
            .sorted(Comparator.comparing(StudentProfileResponse.WorksheetAssignmentSummary::assignedAt,
                Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(StudentProfileResponse.WorksheetAssignmentSummary::worksheetId))
            .toList();
    }

    private StudentProfileResponse.WorksheetAssignmentSummary assignmentSummary(
        Worksheet worksheet,
        WorksheetAssignment assignment
    ) {
        return new StudentProfileResponse.WorksheetAssignmentSummary(
            worksheet.getId(), worksheet.getTitle(), assignment.getAssignmentType(), assignment.getClassId(),
            assignment.getAssignedAt(), assignment.getDueAt());
    }

    private StudentProfileResponse.TutorOnly tutorOnly(StudentProfile student) {
        List<TutorAlert.AlertStatus> activeStatuses = List.of(
            TutorAlert.AlertStatus.OPEN, TutorAlert.AlertStatus.ACKNOWLEDGED);
        List<StudentProfileResponse.AlertSummary> activeAlerts = alerts
            .findActiveByTutorIdAndStudentProfileId(student.getTutorId(), student.getId(), activeStatuses)
            .stream()
            .map(alert -> new StudentProfileResponse.AlertSummary(
                alert.getId(), alert.getAlertType().name(), alert.getSeverity().name(),
                alert.getAlertStatus().name(), alert.getTitle(), alert.getCreatedAt()))
            .toList();
        List<StudentProfileResponse.ReportMetadata> reportMetadata = reports
            .findAllByStudentProfileIdOrderByPeriodEndDesc(student.getId()).stream()
            .filter(report -> student.getTutorId().equals(report.getTutorId()))
            .map(this::reportMetadata)
            .toList();
        long approvedWorksheetCount = approvedResults.countDistinctActiveWorksheetIdsByTutorAndStudent(
            student.getTutorId(), student.getId());
        return new StudentProfileResponse.TutorOnly(activeAlerts, reportMetadata, approvedWorksheetCount);
    }

    private StudentProfileResponse.TopicSummary topicSummary(MasteryRecord record) {
        return new StudentProfileResponse.TopicSummary(record.getSyllabusTopic().getId(),
            record.getSyllabusTopic().getName(), record.getScore(), record.getMasteryStatus());
    }

    private StudentProfileResponse.ReportMetadata reportMetadata(ProgressReport report) {
        return new StudentProfileResponse.ReportMetadata(report.getId(), report.getReportCode(),
            report.getReportStatus(), report.getPeriodStart(), report.getPeriodEnd(),
            report.getGeneratedAt(), report.getFinalizedAt());
    }

    private StudentProfileResponse.HistoryItem historyItem(MasteryRecord record, MasteryHistory history) {
        return new StudentProfileResponse.HistoryItem(record.getSyllabusTopic().getId(),
            record.getSyllabusTopic().getName(), history.getPreviousScore(), history.getNewScore(),
            history.getPreviousStatus(), history.getNewStatus(), history.getReason(), history.getCreatedAt());
    }

    private static BigDecimal average(BigDecimal total, int count) {
        return total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private void ensureLoginIdentityAvailable(Long loginUserId, Long currentStudentId) {
        if (loginUserId == null) {
            return;
        }
        students.findByLoginUserId(loginUserId)
            .filter(existing -> currentStudentId == null || !currentStudentId.equals(existing.getId()))
            .ifPresent(existing -> {
                throw new LoginIdentityConflictException(loginUserId);
            });
    }

    private StudentProfile requireOwnedStudent(long tutorId, long studentId) {
        return students.findByIdAndTutorId(studentId, tutorId)
            .orElseThrow(() -> new StudentNotFoundException(studentId));
    }

    private void requireOwnedClass(long tutorId, long classId) {
        if (!classes.findByIdAndTutorId(classId, tutorId).isPresent()) {
            throw new ClassNotFoundException(classId);
        }
    }

    private void validateRequest(StudentRequest request) {
        if (request == null) {
            throw new InvalidStudentRequestException("Student request is required");
        }
    }

    private void requireTutor(long tutorId) {
        if (tutorId <= 0) {
            throw new InvalidStudentRequestException("Authenticated tutor id must be positive");
        }
    }

    private RuntimeException conflictFor(StudentRequest request, DataIntegrityViolationException exception) {
        if (request.loginUserId() != null) {
            return new LoginIdentityConflictException(request.loginUserId(), exception);
        }
        return new StudentPersistenceException(exception);
    }

    public static class StudentNotFoundException extends RuntimeException {
        public StudentNotFoundException(long studentId) {
            super("Student " + studentId + " was not found for this tutor");
        }
    }

    /** Same response for a missing, foreign, or unlinked profile. */
    public static class ProfileNotFoundException extends RuntimeException {
        public ProfileNotFoundException() {
            super("Student profile was not found");
        }
    }

    public static class ClassNotFoundException extends RuntimeException {
        public ClassNotFoundException(long classId) {
            super("Class " + classId + " was not found for this tutor");
        }
    }

    public static class DuplicateMembershipException extends RuntimeException {
        public DuplicateMembershipException(long classId) {
            super("Class " + classId + " appears more than once in this student request");
        }
    }

    public static class LoginIdentityConflictException extends RuntimeException {
        public LoginIdentityConflictException(long loginUserId) {
            super("Login identity " + loginUserId + " is already linked to another student");
        }

        public LoginIdentityConflictException(long loginUserId, Throwable cause) {
            super("Login identity " + loginUserId + " is already linked to another student", cause);
        }
    }

    public static class InvalidStudentRequestException extends RuntimeException {
        public InvalidStudentRequestException(String message) {
            super(message);
        }
    }

    public static class StudentPersistenceException extends RuntimeException {
        public StudentPersistenceException(Throwable cause) {
            super("Student data could not be saved", cause);
        }
    }
}
