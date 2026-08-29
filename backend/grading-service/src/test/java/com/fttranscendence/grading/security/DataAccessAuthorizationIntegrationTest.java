package com.fttranscendence.grading.security;

import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.ocr.OcrExtraction;
import com.fttranscendence.grading.repository.OcrExtractionRepository;
import com.fttranscendence.grading.repository.SubmissionDocumentRepository;
import com.fttranscendence.grading.storage.DocumentStorage;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the public HTTP boundary rather than relying on controller method
 * calls.  Cross-owner paths deliberately use the same 404 response as missing
 * records so stable database identifiers cannot be enumerated.
 */
@SpringBootTest
@AutoConfigureMockMvc
class DataAccessAuthorizationIntegrationTest {

    private static final String JWT_SECRET =
        "test-secret-key-that-is-at-least-thirty-two-bytes-long";
    private static final long OWNER_STUDENT_USER_ID = 101L;
    private static final long OTHER_STUDENT_USER_ID = 202L;
    private static final long UNRELATED_TUTOR_USER_ID = 303L;

    @Autowired private MockMvc mockMvc;
    @Autowired private RestTemplate restTemplate;
    @Autowired private DocumentStorage storage;
    @Autowired private SubmissionDocumentRepository documents;
    @Autowired private OcrExtractionRepository extractions;

    private MockRestServiceServer learningServer;
    private Long createdExtractionId;
    private Long createdDocumentId;

    @BeforeEach
    void bindLearningService() {
        learningServer = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @AfterEach
    void removeOwnedFixture() {
        if (createdExtractionId != null) {
            extractions.deleteById(createdExtractionId);
        }
        if (createdDocumentId != null) {
            documents.deleteById(createdDocumentId);
        }
    }

    @Test
    void anonymousAndUnlistedRoutesAreDeniedIncludingTheFormerBulkSubmissionPath() throws Exception {
        mockMvc.perform(get("/api/grading/submissions"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/grading/submissions")
                .header(HttpHeaders.AUTHORIZATION, bearer("TUTOR", UNRELATED_TUTOR_USER_ID)))
            .andExpect(status().isForbidden());

        mockMvc.perform(multipart("/api/grading/submission-documents")
                .param("studentId", "1")
                .param("worksheetId", "1")
                .file("files", pngBytes("page")))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/grading/ocr-extractions/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"correctedText\":\"answer\"}"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(multipart("/api/grading/ocr")
                .file("file", pngBytes("page")))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void tutorOnlyReviewsRejectStudentsWhileExplicitOcrRoutesAllowOnlyDomainRoles() throws Exception {
        mockMvc.perform(get("/api/grading/tutor/reviews/100")
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OWNER_STUDENT_USER_ID)))
            .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/grading/ocr-extractions/999999")
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OWNER_STUDENT_USER_ID))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"correctedText\":\"answer\"}"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("OCR_EXTRACTION_NOT_FOUND"));

        mockMvc.perform(multipart("/api/grading/ocr")
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OWNER_STUDENT_USER_ID))
                .file("file", pngBytes("retired")))
            .andExpect(status().isForbidden());
    }

    @Test
    void ruleChecksRequireTutorAndUseNonEnumeratingAuthoritativeQuestionScope() throws Exception {
        mockMvc.perform(post("/api/grading/tutor/questions/601/rule-check")
                .contentType(MediaType.APPLICATION_JSON).content("{\"answer\":\"heat conduction\"}"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/grading/tutor/questions/601/rule-check")
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OWNER_STUDENT_USER_ID))
                .contentType(MediaType.APPLICATION_JSON).content("{\"answer\":\"heat conduction\"}"))
            .andExpect(status().isForbidden());

        learningServer.expect(once(), requestTo("http://localhost:8083/api/learning/tutor/questions/601"))
            .andRespond(withStatus(HttpStatus.NOT_FOUND));
        mockMvc.perform(post("/api/grading/tutor/questions/601/rule-check")
                .header(HttpHeaders.AUTHORIZATION, bearer("TUTOR", UNRELATED_TUTOR_USER_ID))
                .contentType(MediaType.APPLICATION_JSON).content("{\"answer\":\"heat conduction\"}"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("QUESTION_NOT_FOUND"));
        learningServer.verify();

        learningServer.reset();
        learningServer.expect(once(), requestTo("http://localhost:8083/api/learning/tutor/questions/601"))
            .andRespond(withSuccess("""
                {"id":601,"prompt":"Why?","modelAnswer":"Heat conducts.","totalMarks":2,
                 "keywords":["conductor"],"syllabusTopic":{"id":44,"code":"SCI-44"},
                 "markingComponents":[{"position":0,"description":"Explains heat conduction","marks":2}]}
                """, MediaType.APPLICATION_JSON));
        mockMvc.perform(post("/api/grading/tutor/questions/601/rule-check")
                .header(HttpHeaders.AUTHORIZATION, bearer("TUTOR", UNRELATED_TUTOR_USER_ID))
                .contentType(MediaType.APPLICATION_JSON).content("{\"answer\":\"heat conduction\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.awardedMarks").value(2.0))
            .andExpect(jsonPath("$.componentResults[0].matched").value(true));
        learningServer.verify();
    }

    @Test
    void mistakeHistoryIsSelfScopedForStudentsAndNonEnumeratingForTutors() throws Exception {
        learningServer.expect(once(), requestTo("http://localhost:8083/api/learning/student/profile"))
            .andRespond(withSuccess("{\"id\":501}", MediaType.APPLICATION_JSON));

        mockMvc.perform(get("/api/grading/mistakes/me")
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OWNER_STUDENT_USER_ID)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
        learningServer.verify();

        mockMvc.perform(get("/api/grading/mistakes/students/501")
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OWNER_STUDENT_USER_ID)))
            .andExpect(status().isForbidden());

        learningServer.reset();
        learningServer.expect(once(), requestTo("http://localhost:8083/api/learning/tutor/students/501"))
            .andRespond(withStatus(HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/grading/mistakes/students/501")
                .header(HttpHeaders.AUTHORIZATION, bearer("TUTOR", UNRELATED_TUTOR_USER_ID)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("MISTAKE_HISTORY_NOT_FOUND"));
        learningServer.verify();

        learningServer.reset();
        learningServer.expect(once(), requestTo("http://localhost:8083/api/learning/tutor/students/999999"))
            .andRespond(withStatus(HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/grading/mistakes/students/999999")
                .header(HttpHeaders.AUTHORIZATION, bearer("TUTOR", UNRELATED_TUTOR_USER_ID)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("MISTAKE_HISTORY_NOT_FOUND"));
        learningServer.verify();
    }

    @Test
    void learningScopeDeniesCrossTutorAndUnrelatedStudentDocumentCreation() throws Exception {
        learningServer.expect(once(), requestTo("http://localhost:8083/api/learning/internal/submission-authorization"))
            .andRespond(withStatus(HttpStatus.NOT_FOUND));

        mockMvc.perform(multipart("/api/grading/submission-documents")
                .header(HttpHeaders.AUTHORIZATION, bearer("TUTOR", UNRELATED_TUTOR_USER_ID))
                .param("studentId", "901")
                .param("worksheetId", "401")
                .file("files", pngBytes("cross-tutor")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("SUBMISSION_FORBIDDEN"));
        learningServer.verify();

        learningServer.reset();
        learningServer.expect(once(), requestTo("http://localhost:8083/api/learning/internal/submission-authorization"))
            .andRespond(withStatus(HttpStatus.NOT_FOUND));

        mockMvc.perform(multipart("/api/grading/submission-documents")
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OTHER_STUDENT_USER_ID))
                .param("studentId", "902")
                .param("worksheetId", "401")
                .file("files", pngBytes("cross-student")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("SUBMISSION_FORBIDDEN"));
        learningServer.verify();
    }

    @Test
    void studentCanCorrectOnlyTheirOwnExtractionAndForeignIdsAreNonEnumerating() throws Exception {
        long extractionId = ownedExtraction();

        mockMvc.perform(patch("/api/grading/ocr-extractions/{id}", extractionId)
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OTHER_STUDENT_USER_ID))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"correctedText\":\"other answer\"}"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("OCR_EXTRACTION_NOT_FOUND"));

        mockMvc.perform(patch("/api/grading/ocr-extractions/{id}", extractionId + 100_000)
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OTHER_STUDENT_USER_ID))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"correctedText\":\"other answer\"}"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("OCR_EXTRACTION_NOT_FOUND"));

        mockMvc.perform(patch("/api/grading/ocr-extractions/{id}", extractionId)
                .header(HttpHeaders.AUTHORIZATION, bearer("STUDENT", OWNER_STUDENT_USER_ID))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"correctedText\":\"my corrected answer\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value("my corrected answer"));
    }

    private long ownedExtraction() {
        DocumentStorage.StoredFile stored = storage.store(
            OWNER_STUDENT_USER_ID,
            "answer.png",
            "image/png",
            pngBytes("answer")
        );
        SubmissionDocument document = new SubmissionDocument(
            OWNER_STUDENT_USER_ID,
            SubmissionDocument.OwnerRole.STUDENT,
            401L,
            501L,
            SubmissionDocument.SourceType.IMAGES
        );
        document.addPage(stored);
        document.markReady();
        document = documents.saveAndFlush(document);
        createdDocumentId = document.getId();

        OcrExtraction extraction = extractions.saveAndFlush(new OcrExtraction(
            document.getPages().get(0),
            601L,
            "original answer",
            0.4,
            "test"
        ));
        createdExtractionId = extraction.getId();
        return extraction.getId();
    }

    private static byte[] pngBytes(String text) {
        byte[] signature = new byte[] {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A
        };
        byte[] body = text.getBytes(StandardCharsets.UTF_8);
        byte[] bytes = new byte[signature.length + body.length];
        System.arraycopy(signature, 0, bytes, 0, signature.length);
        System.arraycopy(body, 0, bytes, signature.length, body.length);
        return bytes;
    }

    private static String bearer(String role, long userId) {
        String jwt = Jwts.builder()
            .setSubject(role.toLowerCase() + "@example.com")
            .claim("role", role)
            .claim("userId", userId)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 3_600_000))
            .signWith(Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
            .compact();
        return "Bearer " + jwt;
    }
}
