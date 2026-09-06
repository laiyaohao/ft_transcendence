package com.fttranscendence.learning.question.imports;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.imageio.ImageIO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class QuestionImportIntegrationTest {
    private static final String SECRET = "test-secret-key-that-is-at-least-thirty-two-bytes-long";
    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    void keepsImageImportsAsReviewDraftsUntilTutorEditsAndConfirmsThem() throws Exception {
        int questionCountBeforeUpload = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM questions", Integer.class);
        String response = mockMvc.perform(multipart("/api/learning/tutor/question-imports")
                .file(new MockMultipartFile("files", "scan.png", "image/png", onePixelPng()))
                .header("Authorization", bearer("TUTOR")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.candidates[0].status").value("UNCERTAIN"))
            .andExpect(jsonPath("$.candidates[0].warningMessage").exists())
            .andReturn().getResponse().getContentAsString();
        long batchId = idAfter(response, "\\\"id\\\":(\\d+)");
        long candidateId = idAfter(response, "\\\"candidates\\\".*?\\\"id\\\":(\\d+)");
        long pageId = idAfter(response, "\\\"pageId\\\":(\\d+)");
        assertEquals(questionCountBeforeUpload, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM questions", Integer.class));

        mockMvc.perform(get("/api/learning/tutor/question-imports/{batchId}", batchId)
                .header("Authorization", bearer("STUDENT")))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/learning/tutor/question-imports/{batchId}/source-pages/{pageId}/image", batchId, pageId)
                .header("Authorization", bearer("TUTOR")))
            .andExpect(status().isOk());

        long topicId = jdbcTemplate.queryForObject("SELECT id FROM syllabus_topics WHERE code = ?", Long.class,
            "SCI_P5_CYCLES_MATTER_WATER_WATER");
        String update = """
            {"code":"SCI-IMPORT-001","syllabusTopicId":%d,"prompt":"Explain evaporation.",
             "modelAnswer":"Water gains heat energy.","totalMarks":2,"questionType":"OPEN_ENDED",
             "difficulty":"APPLICATION","includeSourceImage":true}
            """.formatted(topicId);
        mockMvc.perform(put("/api/learning/tutor/question-imports/{batchId}/candidates/{candidateId}", batchId, candidateId)
                .header("Authorization", bearer("TUTOR")).contentType(MediaType.APPLICATION_JSON).content(update))
            .andExpect(status().isOk()).andExpect(jsonPath("$.prompt").value("Explain evaporation."));
        mockMvc.perform(post("/api/learning/tutor/question-imports/{batchId}/import", batchId)
                .header("Authorization", bearer("TUTOR")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"candidateIds\":[" + candidateId + "]}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.questionIds.length()").value(1));
        assertEquals("ARCHIVED", jdbcTemplate.queryForObject("SELECT archive_state FROM questions WHERE code = 'SCI-IMPORT-001'", String.class));
        assertEquals(1, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM question_images", Integer.class));
    }

    @Test
    void rendersPdfPagesAndSeparatesNumberedQuestionTextIntoReviewDrafts() throws Exception {
        mockMvc.perform(multipart("/api/learning/tutor/question-imports")
                .file(new MockMultipartFile("files", "paper.pdf", "application/pdf", numberedPdf()))
                .header("Authorization", bearer("TUTOR")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.candidates.length()").value(2))
            .andExpect(jsonPath("$.candidates[0].prompt").value(org.hamcrest.Matchers.containsString("1. Explain evaporation.")))
            .andExpect(jsonPath("$.candidates[1].prompt").value(org.hamcrest.Matchers.containsString("2. Name a gas.")))
            .andExpect(jsonPath("$.candidates[0].source.pageNumber").value(1));
    }

    private static long idAfter(String json, String expression) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(expression).matcher(json);
        if (!matcher.find()) throw new AssertionError("Missing identifier in response: " + expression);
        return Long.parseLong(matcher.group(1));
    }
    private static String bearer(String role) {
        Instant now = Instant.now();
        return "Bearer " + Jwts.builder().setSubject("tutor@example.com").claim("role", role).claim("userId", 101L)
            .setIssuedAt(Date.from(now)).setExpiration(Date.from(now.plusSeconds(600)))
            .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256).compact();
    }
    private static byte[] onePixelPng() throws Exception {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
    private static byte[] numberedPdf() throws Exception {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(new PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA), 12);
                content.newLineAtOffset(72, 700);
                content.showText("1. Explain evaporation.");
                content.newLineAtOffset(0, -20);
                content.showText("Answer: Water gains heat energy.");
                content.newLineAtOffset(0, -20);
                content.showText("2. Name a gas.");
                content.newLineAtOffset(0, -20);
                content.showText("Answer: Oxygen.");
                content.endText();
            }
            document.save(output);
            return output.toByteArray();
        }
    }
}
