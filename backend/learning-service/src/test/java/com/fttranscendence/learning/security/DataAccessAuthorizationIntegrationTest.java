package com.fttranscendence.learning.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Verifies role gates and owner-scoped lookups at the HTTP boundary. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DataAccessAuthorizationIntegrationTest {
    private static final String SECRET = "test-secret-key-that-is-at-least-thirty-two-bytes-long";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void clear() {
        jdbc.update("DELETE FROM worksheet_assignments");
        jdbc.update("DELETE FROM worksheet_questions");
        jdbc.update("DELETE FROM worksheets");
        jdbc.update("DELETE FROM mastery_history");
        jdbc.update("DELETE FROM mastery_records");
        jdbc.update("DELETE FROM class_memberships");
        jdbc.update("DELETE FROM student_profiles");
        jdbc.update("DELETE FROM class_schedules");
        jdbc.update("DELETE FROM tutor_classes");
    }

    @Test
    void deniesUnauthenticatedUnknownAndWrongRoleRequestsByDefault() throws Exception {
        mvc.perform(get("/api/learning/tutor/students/1/mastery-map"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/learning/tutor/students/1/mastery-map").header("Authorization", bearer("STUDENT", 9001)))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/learning/not-an-api").header("Authorization", bearer("TUTOR", 101)))
            .andExpect(status().isForbidden());
    }

    @Test
    void exposesOnlyTutorOwnedClassAndStudentWhileAStudentCanReadOnlySelf() throws Exception {
        long ownedStudent = student(101, 9001, "Owned Learner");
        long foreignStudent = student(202, 9002, "Foreign Learner");
        long foreignClass = tutorClass(202, "Foreign Class");

        mvc.perform(get("/api/learning/tutor/students/{id}/mastery-map", ownedStudent).header("Authorization", bearer("TUTOR", 101)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.studentId").value(ownedStudent));
        mvc.perform(get("/api/learning/tutor/students/{id}/mastery-map", foreignStudent).header("Authorization", bearer("TUTOR", 101)))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MASTERY_NOT_FOUND"));
        mvc.perform(get("/api/learning/tutor/students/{id}/mastery-map", 999999L).header("Authorization", bearer("TUTOR", 101)))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MASTERY_NOT_FOUND"));
        mvc.perform(get("/api/learning/tutor/classes/{id}", foreignClass).header("Authorization", bearer("TUTOR", 101)))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CLASS_ACCESS_FORBIDDEN"));
        mvc.perform(get("/api/learning/student/mastery-map").header("Authorization", bearer("STUDENT", 9001)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.studentId").value(ownedStudent));
        mvc.perform(get("/api/learning/student/mastery-map").header("Authorization", bearer("STUDENT", 9002)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.studentId").value(foreignStudent));
    }

    @Test
    void validatesUploadContextAgainstAssignmentAndHidesForeignWorksheetIds() throws Exception {
        long student = student(101, 9001, "Assigned Learner");
        long worksheet = approvedStudentWorksheet(101, student, "ASSIGNED-1");
        String body = """
            {"actorUserId":9001,"actorRole":"STUDENT","studentId":%d,"worksheetId":%d}
            """.formatted(student, worksheet);

        mvc.perform(post("/api/learning/internal/submission-authorization")
                .header("X-Learning-Integration-Key", "test-learning-marking-sync-key")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isNoContent());
        mvc.perform(post("/api/learning/internal/submission-authorization")
                .header("X-Learning-Integration-Key", "test-learning-marking-sync-key")
                .contentType(APPLICATION_JSON)
                .content(body.replace("9001", "9002")))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SUBMISSION_CONTEXT_NOT_FOUND"));
        mvc.perform(post("/api/learning/internal/submission-authorization")
                .header("X-Learning-Integration-Key", "wrong-key")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("SUBMISSION_AUTHORIZATION_FORBIDDEN"));
    }

    private long student(long tutorId, long loginUserId, String name) {
        jdbc.update("INSERT INTO student_profiles (tutor_id, login_user_id, full_name) VALUES (?, ?, ?)", tutorId, loginUserId, name);
        return jdbc.queryForObject("SELECT id FROM student_profiles WHERE login_user_id = ?", Long.class, loginUserId);
    }

    private long tutorClass(long tutorId, String name) {
        jdbc.update("INSERT INTO tutor_classes (tutor_id, class_name, normalized_class_name, subject, class_level, status) VALUES (?, ?, ?, 'Science', 'P5', 'ACTIVE')", tutorId, name, name.toLowerCase());
        return jdbc.queryForObject("SELECT id FROM tutor_classes WHERE tutor_id = ? AND class_name = ?", Long.class, tutorId, name);
    }

    private long approvedStudentWorksheet(long tutorId, long studentId, String code) {
        jdbc.update("INSERT INTO worksheets (tutor_id, code, title, audience_type, status, approved_at) VALUES (?, ?, ?, 'STUDENT', 'APPROVED', CURRENT_TIMESTAMP)",
            tutorId, code, "Assigned worksheet");
        long worksheetId = jdbc.queryForObject("SELECT id FROM worksheets WHERE tutor_id = ? AND code = ?", Long.class, tutorId, code);
        jdbc.update("INSERT INTO worksheet_assignments (worksheet_id, tutor_id, assignment_type, target_id, student_profile_id) VALUES (?, ?, 'STUDENT', ?, ?)",
            worksheetId, tutorId, studentId, studentId);
        return worksheetId;
    }

    private String bearer(String role, long userId) {
        Instant now = Instant.now();
        return "Bearer " + Jwts.builder().setSubject("person@example.com").claim("role", role).claim("userId", userId)
            .setIssuedAt(Date.from(now)).setExpiration(Date.from(now.plusSeconds(600)))
            .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256).compact();
    }
}
