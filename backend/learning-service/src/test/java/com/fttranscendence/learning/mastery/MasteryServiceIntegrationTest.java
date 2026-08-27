package com.fttranscendence.learning.mastery;

import com.fttranscendence.learning.student.StudentProfile;
import com.fttranscendence.learning.student.StudentProfileRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class MasteryServiceIntegrationTest {
    @Autowired MasteryService service; @Autowired StudentProfileRepository students;
    @Autowired MasteryRecordRepository records; @Autowired EntityManager entityManager;
    @Test void persistsOnlyApprovedResultsAndIsIdempotent() {
        StudentProfile student = new StudentProfile(); student.setTutorId(101L); student.setFullName("Ada"); students.save(student); entityManager.flush();
        Long topicId = entityManager.createQuery("select t.id from SyllabusTopic t where t.active = true order by t.id", Long.class).setMaxResults(1).getSingleResult();
        var approved = new MasteryService.ApprovedResult(900L, 101L, student.getId(), topicId, new BigDecimal("1.50"), new BigDecimal("2.00"), 0, true);
        MasteryRecord saved = service.applyApprovedResult(approved);
        assertEquals(new BigDecimal("75.00"), saved.getScore()); assertEquals(1, saved.getAttemptCount());
        assertEquals(1, service.applyApprovedResult(approved).getAttemptCount());
        assertThrows(MasteryService.UnapprovedResultException.class, () -> service.applyApprovedResult(new MasteryService.ApprovedResult(901L, 101L, student.getId(), topicId, BigDecimal.ONE, new BigDecimal("2"), 0, false)));
        assertEquals(1, records.findByStudentProfileIdAndSyllabusTopicId(student.getId(), topicId).orElseThrow().getAttemptCount());
    }
}
