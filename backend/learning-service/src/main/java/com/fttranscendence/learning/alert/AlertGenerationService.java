package com.fttranscendence.learning.alert;

import com.fttranscendence.learning.mastery.MasteryDiagnosticEvidence;
import com.fttranscendence.learning.mastery.MasteryDiagnosticEvidenceRepository;
import com.fttranscendence.learning.mastery.MasteryRecord;
import com.fttranscendence.learning.mastery.MasteryRecordRepository;
import com.fttranscendence.learning.student.StudentProfile;
import com.fttranscendence.learning.student.StudentProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Deterministic, explainable, owner-scoped tutor alerts. */
@Service
public class AlertGenerationService {
    static final BigDecimal LOW_MASTERY_THRESHOLD = new BigDecimal("70.00");
    static final int REPEATED_DIAGNOSTIC_THRESHOLD = 2;
    static final java.time.Duration REVIEW_OVERDUE_AFTER = java.time.Duration.ofHours(48);

    private final TutorAlertRepository alerts;
    private final StudentProfileRepository students;
    private final MasteryRecordRepository mastery;
    private final MasteryDiagnosticEvidenceRepository diagnostics;
    private final MarkingReviewStatusProjectionRepository reviews;

    public AlertGenerationService(TutorAlertRepository alerts, StudentProfileRepository students,
                                  MasteryRecordRepository mastery, MasteryDiagnosticEvidenceRepository diagnostics,
                                  MarkingReviewStatusProjectionRepository reviews) {
        this.alerts = alerts; this.students = students; this.mastery = mastery; this.diagnostics = diagnostics; this.reviews = reviews;
    }

    @Transactional
    public List<AlertResponse> refresh(long tutorId) {
        requirePositive(tutorId);
        for (StudentProfile student : students.findAllByTutorIdOrderByFullNameAsc(tutorId)) refreshStudent(tutorId, student);
        refreshOverdueReviews(tutorId, LocalDateTime.now());
        return list(tutorId, List.of(TutorAlert.AlertStatus.OPEN, TutorAlert.AlertStatus.ACKNOWLEDGED));
    }

    @Transactional
    public void refreshOverdueReviews(long tutorId, LocalDateTime now) {
        for (MarkingReviewStatusProjection review : reviews.findByTutorIdAndStateAndRequestedAtLessThanEqualOrderByRequestedAtAsc(
            tutorId, MarkingReviewStatusProjection.State.PENDING_REVIEW, now.minus(REVIEW_OVERDUE_AFTER))) {
            StudentProfile student = review.getStudentProfile();
                createIfAbsent(tutorId, student, null, TutorAlert.AlertType.PENDING_REVIEW, TutorAlert.Severity.WARNING,
                "overdue-review:" + review.getSourceSubmissionId() + ":" + review.getRevision(), "Marking review is overdue",
                "This submission has awaited tutor review since " + review.getRequestedAt() + ".");
        }
    }

    @Transactional
    public void refreshStudent(long tutorId, StudentProfile student) {
        if (student == null || student.getTutorId() == null || !student.getTutorId().equals(tutorId)) throw new AlertNotFoundException();
        List<MasteryRecord> records = mastery.findAllByStudentProfileIdOrderByScoreDesc(student.getId());
        for (MasteryRecord record : records) {
            if (record.getScore().compareTo(LOW_MASTERY_THRESHOLD) < 0 && record.getAttemptCount() > 0) {
                createIfAbsent(tutorId, student, record, TutorAlert.AlertType.WEAK_TOPIC, TutorAlert.Severity.WARNING,
                    "weak-topic:" + student.getId() + ":" + record.getSyllabusTopic().getId() + ":" + record.getCalculatedAt(),
                    record.getSyllabusTopic().getName() + " needs practice",
                    "%s mastery after %d approved attempt%s; the alert threshold is below 70%%."
                        .formatted(percent(record.getScore()), record.getAttemptCount(), record.getAttemptCount() == 1 ? "" : "s"));
            }
        }
        Map<String, List<MasteryDiagnosticEvidence>> repeated = diagnostics.findByStudentProfileIdOrderByCreatedAtDescIdDesc(student.getId()).stream()
            .collect(Collectors.groupingBy(item -> item.getMasteryRecord().getId() + ":" + item.getCategory()));
        for (List<MasteryDiagnosticEvidence> occurrences : repeated.values()) {
            if (occurrences.size() < REPEATED_DIAGNOSTIC_THRESHOLD) continue;
            MasteryDiagnosticEvidence latest = occurrences.get(0);
            MasteryRecord record = latest.getMasteryRecord();
            createIfAbsent(tutorId, student, record, TutorAlert.AlertType.REPEATED_MISTAKE, TutorAlert.Severity.CRITICAL,
                "repeated-diagnostic:" + student.getId() + ":" + record.getSyllabusTopic().getId() + ":" + latest.getCategory() + ":" + latest.getId(),
                "Repeated " + label(latest.getCategory()) + " in " + record.getSyllabusTopic().getName(),
                "%d tutor-confirmed %s records were captured for this topic."
                    .formatted(occurrences.size(), label(latest.getCategory()).toLowerCase()));
        }
    }

    @Transactional
    public List<AlertResponse> list(long tutorId, List<TutorAlert.AlertStatus> statuses) {
        requirePositive(tutorId);
        return alerts.findAllByTutorIdAndAlertStatusInOrderByCreatedAtDescIdDesc(tutorId, statuses).stream().map(AlertResponse::from).toList();
    }

    @Transactional
    public AlertResponse resolve(long tutorId, long alertId) { return mutate(tutorId, alertId, true); }
    @Transactional
    public AlertResponse dismiss(long tutorId, long alertId) { return mutate(tutorId, alertId, false); }

    private AlertResponse mutate(long tutorId, long alertId, boolean resolve) {
        TutorAlert alert = alerts.findByIdAndTutorId(alertId, tutorId).orElseThrow(AlertNotFoundException::new);
        if (resolve) alert.resolve(tutorId); else alert.dismiss(tutorId);
        return AlertResponse.from(alerts.save(alert));
    }

    private void createIfAbsent(long tutorId, StudentProfile student, MasteryRecord record, TutorAlert.AlertType type,
                                TutorAlert.Severity severity, String key, String title, String message) {
        if (alerts.findByTutorIdAndDeduplicationKey(tutorId, key).isPresent()) return;
        try { alerts.save(new TutorAlert(tutorId, student, record, type, severity, key, title, message)); }
        catch (DataAccessException ignored) { /* unique key means a concurrent refresh created the same alert */ }
    }

    private static String percent(BigDecimal value) { return value.stripTrailingZeros().toPlainString() + "%"; }
    private static String label(MasteryDiagnosticEvidence.Category category) { return switch (category) { case CONCEPT -> "concept weakness"; case KEYWORD -> "keyword omission"; case EXPRESSION -> "expression weakness"; case APPLICATION -> "application weakness"; }; }
    private static void requirePositive(long value) { if (value <= 0) throw new IllegalArgumentException("Tutor id must be positive."); }

    public record AlertResponse(Long id, Long studentId, String studentName, TutorAlert.AlertType type,
                                TutorAlert.Severity severity, TutorAlert.AlertStatus status, String title,
                                String message, java.time.LocalDateTime createdAt) {
        static AlertResponse from(TutorAlert alert) { return new AlertResponse(alert.getId(), alert.getStudentProfile().getId(), alert.getStudentProfile().getFullName(), alert.getAlertType(), alert.getSeverity(), alert.getAlertStatus(), alert.getTitle(), alert.getMessage(), alert.getCreatedAt()); }
    }
    public static class AlertNotFoundException extends RuntimeException { }
}
