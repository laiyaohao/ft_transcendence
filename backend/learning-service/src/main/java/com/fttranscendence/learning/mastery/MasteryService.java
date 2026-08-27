package com.fttranscendence.learning.mastery;

import com.fttranscendence.learning.student.StudentProfile;
import com.fttranscendence.learning.student.StudentProfileRepository;
import com.fttranscendence.learning.syllabus.SyllabusTopic;
import com.fttranscendence.learning.syllabus.SyllabusTopicRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/** Applies only authoritative Tutor-approved marking results to persisted topic mastery. */
@Service
public class MasteryService {
    private final MasteryRecordRepository records;
    private final StudentProfileRepository students;
    private final SyllabusTopicRepository topics;
    private final MasteryCalculator calculator;

    public MasteryService(MasteryRecordRepository records, StudentProfileRepository students,
                          SyllabusTopicRepository topics, MasteryCalculator calculator) {
        this.records = records; this.students = students; this.topics = topics; this.calculator = calculator;
    }

    @Transactional
    public MasteryRecord applyApprovedResult(ApprovedResult result) {
        if (result == null || !result.approved()) throw new UnapprovedResultException();
        requirePositive(result.submissionId(), "Submission id"); requirePositive(result.tutorId(), "Tutor id"); requirePositive(result.studentId(), "Student id");
        requirePositive(result.syllabusTopicId(), "Syllabus topic id");
        StudentProfile student = students.findByIdAndTutorId(result.studentId(), result.tutorId()).orElseThrow(StudentNotFoundException::new);
        SyllabusTopic topic = topics.findById(result.syllabusTopicId()).filter(SyllabusTopic::isActive).orElseThrow(TopicNotFoundException::new);
        MasteryRecord record = records.findByStudentProfileIdAndSyllabusTopicId(student.getId(), topic.getId())
            .orElseGet(() -> new MasteryRecord(student, topic));
        if (record.getHistory().stream().anyMatch(history -> result.submissionId().equals(history.getSourceSubmissionId()))) return record;
        MasteryCalculator.Result calculated = calculator.calculate(record.getScore(), record.getAttemptCount(), result.approvedMarks(), result.availableMarks(), result.repeatedMistakeCount())
            .orElseThrow(() -> new InvalidResultException("Approved marks and available marks are required."));
        record.updateScore(calculated.score(), result.submissionId(), "Approved result: " + calculated.adjustedAttemptPercent() + "% attempt evidence");
        return records.save(record);
    }

    private static void requirePositive(Long value, String field) { if (value == null || value <= 0) throw new InvalidResultException(field + " must be positive."); }

    public record ApprovedResult(Long submissionId, Long tutorId, Long studentId, Long syllabusTopicId,
                                 BigDecimal approvedMarks, BigDecimal availableMarks, int repeatedMistakeCount,
                                 boolean approved) { }
    public static class UnapprovedResultException extends RuntimeException { }
    public static class StudentNotFoundException extends RuntimeException { }
    public static class TopicNotFoundException extends RuntimeException { }
    public static class InvalidResultException extends RuntimeException { public InvalidResultException(String message) { super(message); } }
}
