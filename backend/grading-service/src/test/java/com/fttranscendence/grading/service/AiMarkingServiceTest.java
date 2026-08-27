package com.fttranscendence.grading.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiMarkingServiceTest {
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
    void acceptsACompleteProviderSuggestionAsAdvisoryOnly() {
        when(restTemplate.postForObject(eq("http://localhost/ai-test"), any(HttpEntity.class), eq(AiGradingService.ApiResponse.class)))
            .thenReturn(response("{\"suggested_marks\":1.5,\"correctness\":\"Partially correct\",\"error_category\":\"Missing key point\",\"missing_keywords\":[\"conduction\"],\"feedback\":\"Explain heat transfer.\"}"));

        AiGradingService.AiMarkingResult result = mark("Metal transfers heat.");

        assertEquals(new BigDecimal("1.50"), result.suggestedMarks());
        assertEquals("Partially correct", result.correctness());
        assertEquals(List.of("conduction"), result.missingKeywords());
        assertEquals(true, result.providerResponseValid());
    }

    @Test
    void fallsBackWhenProviderFieldsAreMissingOrMalformed() {
        when(restTemplate.postForObject(eq("http://localhost/ai-test"), any(HttpEntity.class), eq(AiGradingService.ApiResponse.class)))
            .thenReturn(response("{\"correctness\":\"Correct\",\"feedback\":\"Looks good\"}"));

        AiGradingService.AiMarkingResult result = mark("METAL CONDUCTOR");

        assertEquals(new BigDecimal("2.00"), result.suggestedMarks());
        assertEquals("AI_RESPONSE_INVALID", result.errorCategory());
        assertEquals(false, result.providerResponseValid());
    }

    @Test
    void fallsBackDeterministicallyForTimeoutAndUnavailableProvider() {
        when(restTemplate.postForObject(eq("http://localhost/ai-test"), any(HttpEntity.class), eq(AiGradingService.ApiResponse.class)))
            .thenThrow(new RestClientException("timeout"));

        AiGradingService.AiMarkingResult result = mark("An unrelated answer");

        assertEquals(new BigDecimal("0.00"), result.suggestedMarks());
        assertEquals("AI_UNAVAILABLE", result.errorCategory());
        assertEquals(List.of("conductor"), result.missingKeywords());
    }

    private AiGradingService.AiMarkingResult mark(String answer) {
        return service.evaluateMarking("Why does metal feel hot?", "Metal conducts heat.", List.of("Explains conduction"),
            List.of("conductor"), answer, new BigDecimal("2.00"));
    }

    private AiGradingService.ApiResponse response(String content) {
        return new AiGradingService.ApiResponse(List.of(
            new AiGradingService.Choice(new AiGradingService.Message("assistant", content))
        ));
    }
}
