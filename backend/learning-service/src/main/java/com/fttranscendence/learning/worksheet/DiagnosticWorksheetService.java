package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.classroom.TutorClassRepository;
import com.fttranscendence.learning.mastery.MasteryRecord;
import com.fttranscendence.learning.mastery.MasteryRecordRepository;
import com.fttranscendence.learning.student.StudentProfile;
import com.fttranscendence.learning.student.StudentProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

/** Uses only persisted mastery evidence; it never infers performance from grading data. */
@Service
public class DiagnosticWorksheetService {
    private final TutorClassRepository classes;
    private final StudentProfileRepository students;
    private final MasteryRecordRepository mastery;

    public DiagnosticWorksheetService(TutorClassRepository classes, StudentProfileRepository students,
            MasteryRecordRepository mastery) {
        this.classes = classes; this.students = students; this.mastery = mastery;
    }

    @Transactional(readOnly = true)
    public Recommendations recommendations(long tutorId, long classId) {
        if (classes.findByIdAndTutorId(classId, tutorId).isEmpty()) throw new WorksheetService.ClassNotFoundException();
        List<StudentProfile> members = students.findAllByTutorIdAndClassIdOrderByFullNameAsc(tutorId, classId);
        if (members.isEmpty()) return Recommendations.insufficient("No active class members are available for a diagnostic worksheet.");
        List<MasteryRecord> evidence = mastery.findAllByStudentProfileIdInWithTopic(members.stream().map(StudentProfile::getId).toList())
            .stream().filter(record -> record.getAttemptCount() > 0).toList();
        if (evidence.isEmpty()) return Recommendations.insufficient("Insufficient mastery evidence: no class member has a recorded mastery attempt.");
        List<Recommendation> items = evidence.stream()
            .sorted(Comparator.comparing(MasteryRecord::getScore)
                .thenComparing(record -> record.getStudentProfile().getId())
                .thenComparing(record -> record.getSyllabusTopic().getName())
                .thenComparing(record -> record.getSyllabusTopic().getId()))
            .map(record -> new Recommendation(record.getStudentProfile().getId(), record.getStudentProfile().getFullName(),
                record.getSyllabusTopic().getId(), record.getSyllabusTopic().getName(), record.getScore(), record.getAttemptCount()))
            .toList();
        return new Recommendations(Status.READY, "Recommendations are based only on recorded mastery attempts.", items);
    }

    public enum Status { READY, INSUFFICIENT_EVIDENCE }
    public record Recommendation(Long studentId, String studentName, Long topicId, String topicName,
                                 BigDecimal masteryPercent, int attemptCount) { }
    public record Recommendations(Status status, String message, List<Recommendation> recommendations) {
        static Recommendations insufficient(String message) { return new Recommendations(Status.INSUFFICIENT_EVIDENCE, message, List.of()); }
    }
}
