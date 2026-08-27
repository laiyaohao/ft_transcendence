package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.classroom.TutorClass;
import com.fttranscendence.learning.classroom.TutorClassRepository;
import com.fttranscendence.learning.mastery.MasteryRecord;
import com.fttranscendence.learning.mastery.MasteryRecordRepository;
import com.fttranscendence.learning.student.StudentProfile;
import com.fttranscendence.learning.student.StudentProfileRepository;
import com.fttranscendence.learning.syllabus.SyllabusTopicRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class DiagnosticWorksheetServiceTest {
    private static final long TUTOR_ID = 101L;
    @Autowired private DiagnosticWorksheetService service;
    @Autowired private TutorClassRepository classes;
    @Autowired private StudentProfileRepository students;
    @Autowired private MasteryRecordRepository mastery;
    @Autowired private SyllabusTopicRepository topics;
    @Autowired private EntityManager entityManager;

    @Test
    void returnsExplicitInsufficientEvidenceUntilRecordedMasteryAttemptsExist() {
        TutorClass tutorClass = tutorClass();
        StudentProfile student = new StudentProfile();
        student.setTutorId(TUTOR_ID); student.setFullName("Ari Tan"); student.addClassMembership(tutorClass.getId());
        students.save(student); entityManager.flush();

        assertEquals(DiagnosticWorksheetService.Status.INSUFFICIENT_EVIDENCE, service.recommendations(TUTOR_ID, tutorClass.getId()).status());

        MasteryRecord record = new MasteryRecord(student, topics.findByCode("SCI_P5_CYCLES_MATTER_WATER_WATER").orElseThrow());
        mastery.save(record); entityManager.flush();
        record.updateScore(new BigDecimal("42.00"), 70001L, "Reviewed response");
        entityManager.flush();

        DiagnosticWorksheetService.Recommendations response = service.recommendations(TUTOR_ID, tutorClass.getId());
        assertEquals(DiagnosticWorksheetService.Status.READY, response.status());
        assertEquals(1, response.recommendations().size());
        assertEquals(student.getId(), response.recommendations().get(0).studentId());
    }

    private TutorClass tutorClass() {
        TutorClass tutorClass = new TutorClass();
        tutorClass.setTutorId(TUTOR_ID); tutorClass.setClassName("Diagnostic science"); tutorClass.setSubject("Science"); tutorClass.setLevel("P5");
        classes.save(tutorClass); entityManager.flush();
        return tutorClass;
    }
}
