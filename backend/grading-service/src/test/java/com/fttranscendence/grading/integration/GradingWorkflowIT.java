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

import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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

    private String bearerToken(String role) {
        String secret = "test-secret-key-that-is-at-least-thirty-two-bytes-long";
        String token = Jwts.builder()
            .setSubject(role.toLowerCase() + "@example.com")
            .claim("role", role)
            .claim("userId", 101L)
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
