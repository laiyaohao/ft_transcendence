package com.fttranscendence.grading.service;

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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiOcrServiceTest {

    @Mock private RestTemplate restTemplate;

    private AiOcrService service;

    @BeforeEach
    void setUp() {
        service = new AiOcrService(restTemplate);
        ReflectionTestUtils.setField(service, "apiUrl", "http://localhost/ocr-test");
        ReflectionTestUtils.setField(service, "visionModel", "test-vision-model");
        ReflectionTestUtils.setField(service, "apiKey", "test-api-key");
    }

    @Test
    void extractsTextAndRemovesInternalReasoningTags() {
        Map<String, Object> response = Map.of(
            "choices",
            List.of(Map.of(
                "message",
                Map.of("content", "<think>hidden reasoning</think>\n  x = 42  ")
            ))
        );
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenReturn(response);

        String result = service.extractTextFromImage("encoded-image");

        assertEquals("x = 42", result);
        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(
            eq("http://localhost/ocr-test"),
            entityCaptor.capture(),
            eq(Map.class)
        );
        assertEquals("Bearer test-api-key", entityCaptor.getValue().getHeaders().getFirst("Authorization"));
        assertTrue(entityCaptor.getValue().getBody().toString().contains("encoded-image"));
    }

    @Test
    void returnsAnExplicitErrorForANullProviderResponse() {
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenReturn(null);

        assertEquals(
            "Error: Empty response from OCR engine.",
            service.extractTextFromImage("encoded-image")
        );
    }

    @Test
    void returnsAnExplicitErrorWhenTheProviderIsUnavailable() {
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenThrow(new RestClientException("timeout"));

        assertEquals(
            "Error: Could not extract text. timeout",
            service.extractTextFromImage("encoded-image")
        );
    }
}
