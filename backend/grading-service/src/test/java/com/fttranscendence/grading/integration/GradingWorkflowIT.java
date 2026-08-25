package com.fttranscendence.grading.integration;

import com.fttranscendence.grading.repository.SubmissionRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GradingWorkflowIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private RestTemplate restTemplate;
    @Autowired private SubmissionRepository submissionRepository;

    private MockRestServiceServer aiServer;

    @BeforeEach
    void setUp() {
        submissionRepository.deleteAll();
        aiServer = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void analyzeSubmissionCallsAiPersistsDiagnosticAndReturnsItFromTheApi() throws Exception {
        aiServer.expect(once(), requestTo("http://localhost/ai-test"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("Metal transfers heat quickly")))
            .andRespond(withSuccess("""
                {
                  "choices": [
                    {
                      "message": {
                        "role": "assistant",
                        "content": "{\\\"correctness\\\":\\\"Partially Correct\\\",\\\"error_category\\\":\\\"Missing key point\\\",\\\"missing_keywords\\\":[\\\"conduction\\\"],\\\"feedback\\\":\\\"Explain transfer to the hand.\\\"}"
                      }
                    }
                  ]
                }
                """, MediaType.APPLICATION_JSON));

        mockMvc.perform(post("/api/grading/analyze")
                .header(HttpHeaders.AUTHORIZATION, bearerToken("TUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "questionId": "question-1",
                      "studentId": 42,
                      "studentAnswer": "Metal transfers heat quickly"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.correctness").value("Partially Correct"))
            .andExpect(jsonPath("$.error_category").value("Missing key point"))
            .andExpect(jsonPath("$.missing_keywords[0]").value("conduction"))
            .andExpect(jsonPath("$.feedback").value("Explain transfer to the hand."));

        mockMvc.perform(get("/api/grading/submissions")
                .header(HttpHeaders.AUTHORIZATION, bearerToken("TUTOR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].studentId").value(42))
            .andExpect(jsonPath("$[0].questionId").value("question-1"))
            .andExpect(jsonPath("$[0].correctness").value("Partially Correct"));

        aiServer.verify();
    }

    @Test
    void ocrUploadReturnsCleanedTextFromTheVisionProvider() throws Exception {
        aiServer.expect(once(), requestTo("http://localhost/ai-test"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("cGFnZS1ieXRlcw==")))
            .andRespond(withSuccess("""
                {
                  "choices": [
                    {
                      "message": {
                        "content": "<think>internal reasoning</think>\\nForce = mass x acceleration"
                      }
                    }
                  ]
                }
                """, MediaType.APPLICATION_JSON));

        mockMvc.perform(multipart("/api/grading/ocr")
                .header(HttpHeaders.AUTHORIZATION, bearerToken("STUDENT"))
                .file("file", "page-bytes".getBytes()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.extracted_text").value("Force = mass x acceleration"));

        aiServer.verify();
    }

    @Test
    void providerFailureProducesAndPersistsTheDeterministicFallback() throws Exception {
        aiServer.expect(once(), requestTo("http://localhost/ai-test"))
            .andRespond(withServerError());

        mockMvc.perform(post("/api/grading/analyze")
                .header(HttpHeaders.AUTHORIZATION, bearerToken("TUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "questionId": "question-2",
                      "studentId": 84,
                      "studentAnswer": "An uncertain answer"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.error_category").value("Unclassified"))
            .andExpect(jsonPath("$.feedback").value("System error."));

        mockMvc.perform(get("/api/grading/submissions")
                .header(HttpHeaders.AUTHORIZATION, bearerToken("TUTOR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].studentId").value(84))
            .andExpect(jsonPath("$[0].errorCategory").value("Unclassified"));

        aiServer.verify();
    }

    private String bearerToken(String role) {
        String secret = "test-secret-key-that-is-at-least-thirty-two-bytes-long";
        String token = Jwts.builder()
            .setSubject(role.toLowerCase() + "@example.com")
            .claim("role", role)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 3_600_000))
            .signWith(
                Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)),
                SignatureAlgorithm.HS256
            )
            .compact();
        return "Bearer " + token;
    }
}
