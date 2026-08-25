package com.fttranscendence.grading.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiGradingServiceTest {

    @Mock private RestTemplate restTemplate;

    private AiGradingService service;

    @BeforeEach
    void setUp() {
        service = new AiGradingService(restTemplate, new ObjectMapper());
        ReflectionTestUtils.setField(service, "apiUrl", "http://localhost/ai-test");
        ReflectionTestUtils.setField(service, "apiModel", "test-model");
        ReflectionTestUtils.setField(service, "apiKey", "test-api-key");
    }

    @Test
    void parsesAValidStructuredAiResponse() {
        var apiResponse = new AiGradingService.ApiResponse(List.of(
            new AiGradingService.Choice(new AiGradingService.Message(
                "assistant",
                "{\"correctness\":\"Partially Correct\",\"error_category\":\"Missing key point\",\"missing_keywords\":[\"conductor\"],\"feedback\":\"Mention heat conduction.\"}"
            ))
        ));
        when(restTemplate.postForObject(
            eq("http://localhost/ai-test"),
            any(HttpEntity.class),
            eq(AiGradingService.ApiResponse.class)
        )).thenReturn(apiResponse);

        var result = service.evaluateSubmission(
            "Explain why metal feels hotter.",
            List.of("Metal conducts heat"),
            "Metal gets hot faster."
        );

        assertEquals("Partially Correct", result.correctness());
        assertEquals("Missing key point", result.errorCategory());
        assertEquals(List.of("conductor"), result.missingKeywords());
        assertEquals("Mention heat conduction.", result.feedback());

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(
            eq("http://localhost/ai-test"),
            entityCaptor.capture(),
            eq(AiGradingService.ApiResponse.class)
        );
        assertEquals("Bearer test-api-key", entityCaptor.getValue().getHeaders().getFirst("Authorization"));
        assertTrue(entityCaptor.getValue().getBody() instanceof AiGradingService.ApiRequest);
    }

    @Test
    void returnsDeterministicFallbackForAnEmptyAiResponse() {
        when(restTemplate.postForObject(
            eq("http://localhost/ai-test"),
            any(HttpEntity.class),
            eq(AiGradingService.ApiResponse.class)
        )).thenReturn(new AiGradingService.ApiResponse(List.of()));

        var result = service.evaluateSubmission("Question", List.of("Target"), "Answer");

        assertEquals("Analysis Complete", result.correctness());
        assertEquals("Unclassified", result.errorCategory());
        assertEquals("System error.", result.feedback());
    }

    @Test
    void returnsDeterministicFallbackForMalformedJson() {
        var apiResponse = new AiGradingService.ApiResponse(List.of(
            new AiGradingService.Choice(
                new AiGradingService.Message("assistant", "not-json")
            )
        ));
        when(restTemplate.postForObject(
            eq("http://localhost/ai-test"),
            any(HttpEntity.class),
            eq(AiGradingService.ApiResponse.class)
        )).thenReturn(apiResponse);

        var result = service.evaluateSubmission("Question", List.of("Target"), "Answer");

        assertEquals("Unclassified", result.errorCategory());
        assertEquals("System error.", result.feedback());
    }

    @Test
    void returnsDeterministicFallbackWhenTheProviderIsUnavailable() {
        when(restTemplate.postForObject(
            eq("http://localhost/ai-test"),
            any(HttpEntity.class),
            eq(AiGradingService.ApiResponse.class)
        )).thenThrow(new RestClientException("timeout"));

        var result = service.evaluateSubmission("Question", List.of("Target"), "Answer");

        assertEquals("Unclassified", result.errorCategory());
        assertEquals("System error.", result.feedback());
    }
}
