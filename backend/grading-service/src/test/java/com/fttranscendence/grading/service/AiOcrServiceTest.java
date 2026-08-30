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
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    void rejectsMissingAndTemplateProviderCredentials() {
        assertThrows(IllegalArgumentException.class, () -> AiOcrService.validateApiKey(null));
        assertThrows(IllegalArgumentException.class,
            () -> AiOcrService.validateApiKey("REPLACE_WITH_AN_APPROVED_AI_PROVIDER_KEY"));
        assertThrows(IllegalArgumentException.class, () -> AiOcrService.validateApiKey("change-me-key"));
        assertDoesNotThrow(() -> AiOcrService.validateApiKey("sk-real-provider-key"));
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
    void preservesTheUploadedImageMediaTypeForVisionProviders() {
        Map<String, Object> response = Map.of(
            "choices", List.of(Map.of("message", Map.of("content", "recognised text")))
        );
        when(restTemplate.postForObject(eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(response);

        service.extract(new byte[] {1, 2, 3}, "image/png");

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(eq("http://localhost/ocr-test"), entityCaptor.capture(), eq(Map.class));
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) entityCaptor.getValue().getBody();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> content = (List<Map<String, Object>>) messages.get(0).get("content");
        @SuppressWarnings("unchecked")
        Map<String, String> imageUrl = (Map<String, String>) content.get(1).get("image_url");
        assertEquals("data:image/png;base64,AQID", imageUrl.get("url"));
    }

    @Test
    void rejectsNonImageOcrInputInsteadOfMislabellingItAsJpeg() {
        AiOcrService.OcrResult result = service.extract(new byte[] {1, 2, 3}, "application/pdf");

        assertTrue(result.unreadable());
        assertTrue(result.text().contains("JPEG or PNG"));
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
