package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.classroom.TutorClass;
import com.fttranscendence.learning.classroom.TutorClassRepository;
import com.fttranscendence.learning.question.Question;
import com.fttranscendence.learning.syllabus.SyllabusTopicRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Transactional
class WorksheetGenerationTest {
    private static final long TUTOR_ID = 101L;
    @Autowired private WorksheetService service;
    @Autowired private TutorClassRepository classes;
    @Autowired private SyllabusTopicRepository topics;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private EntityManager entityManager;

    @Test
    void createsAStableDraftForAnIdempotentRequestThenApprovesAndAssignsAtomically() {
        TutorClass tutorClass = tutorClass();
        long topicId = topics.findByCode("SCI_P5_CYCLES_MATTER_WATER_WATER").orElseThrow().getId();
        insertQuestion("SCI-GEN-002", topicId, "Explain condensation.");
        insertQuestion("SCI-GEN-001", topicId, "Explain evaporation.");
        WorksheetRequests.GenerateWorksheetRequest request = new WorksheetRequests.GenerateWorksheetRequest(
            WorksheetGenerationRequest.TargetMode.CLASS, List.of(topicId), 2, Question.QuestionType.OPEN_ENDED,
            LocalDateTime.now().plusDays(3), "Water revision", "Use complete sentences.", null);

        WorksheetRequests.GenerationRequestResponse first = service.generate(TUTOR_ID, tutorClass.getId(), "worksheet-key-001", request);
        WorksheetRequests.GenerationRequestResponse replay = service.generate(TUTOR_ID, tutorClass.getId(), "worksheet-key-001", request);

        assertEquals(WorksheetGenerationRequest.Status.SUCCEEDED, first.status());
        assertEquals(first.id(), replay.id());
        assertNotNull(first.worksheet());
        assertEquals(List.of("SCI-GEN-001", "SCI-GEN-002"), first.worksheet().questions().stream().map(WorksheetRequests.QuestionSummary::code).toList());
        assertEquals(Worksheet.Status.DRAFT, first.worksheet().status());

        WorksheetRequests.WorksheetResponse approved = service.approveAndAssign(TUTOR_ID, first.worksheet().id(),
            new WorksheetRequests.ApproveWorksheetRequest(null));
        entityManager.flush();
        assertEquals(Worksheet.Status.APPROVED, approved.status());
        assertEquals(1, jdbc.queryForObject("select count(*) from worksheet_assignments where worksheet_id = ?", Integer.class, approved.id()));
    }

    private TutorClass tutorClass() {
        TutorClass tutorClass = new TutorClass();
        tutorClass.setTutorId(TUTOR_ID); tutorClass.setClassName("Generated science"); tutorClass.setSubject("Science"); tutorClass.setLevel("P5");
        classes.save(tutorClass); entityManager.flush();
        return tutorClass;
    }

    private void insertQuestion(String code, long topicId, String prompt) {
        jdbc.update("insert into questions (code, syllabus_topic_id, syllabus_topic_type, question_type, prompt, total_marks, model_answer, archive_state) values (?, ?, 'SUBTOPIC', 'OPEN_ENDED', ?, ?, 'Answer', 'ACTIVE')", code, topicId, prompt, BigDecimal.ONE);
        long questionId = jdbc.queryForObject("select id from questions where code = ?", Long.class, code);
        jdbc.update("insert into marking_components (question_id, position, description, marks) values (?, 0, 'Criterion', ?)", questionId, BigDecimal.ONE);
        entityManager.clear();
    }
}
