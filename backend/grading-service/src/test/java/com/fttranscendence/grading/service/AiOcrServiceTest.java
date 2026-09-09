package com.fttranscendence.grading.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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
    void extractsOnlyStudentAnswersAndSendsAnswerOnlyPrompt() {
        whenProviderReturns(answers("4", .98));

        AiOcrService.OcrResult result = service.extract(new byte[] {1, 2, 3}, "image/jpeg");

        assertEquals("4", result.text());
        assertEquals(.98, result.confidence());
        assertFalse(result.unreadable());
        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(
            eq("http://localhost/ocr-test"), entityCaptor.capture(), eq(Map.class)
        );
        assertEquals("Bearer test-api-key", entityCaptor.getValue().getHeaders().getFirst("Authorization"));
        assertTrue(entityCaptor.getValue().getBody().toString().contains("only content authored by the student"));
        assertTrue(entityCaptor.getValue().getBody().toString().contains("Question 1: What is 2 + 2?"));
    }

    @Test
    void preservesLowModelConfidenceForAnswerOnlyRecognition() {
        whenProviderReturns(answers("x = ?", .31));

        AiOcrService.OcrResult result = service.extract(new byte[] {1, 2, 3}, "image/jpeg");

        assertEquals("x = ?", result.text());
        assertEquals(.31, result.confidence());
        assertFalse(result.unreadable());
    }

    @Test
    void treatsConfirmedNoAnswerImageAsUnreadable() {
        whenProviderReturns(noAnswers(.99));

        AiOcrService.OcrResult result = service.extract(new byte[] {1, 2, 3}, "image/jpeg");

        assertEquals("", result.text());
        assertEquals(0, result.confidence());
        assertTrue(result.unreadable());
    }

    @Test
    void rejectsLegacyMalformedAndUncertainProviderResponses() {
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(
            providerResponse("answer"),
            providerResponse("{\"status\":\"answers\",\"text\":\"4\"}"),
            providerResponse("{\"status\":\"answers\",\"text\":\"4\",\"confidence\":1.2}"),
            providerResponse("{\"status\":\"no_answers\",\"text\":\"printed title\",\"confidence\":.9}"),
            providerResponse("{\"status\":\"uncertain\",\"text\":\"4\",\"confidence\":.8}")
        );

        for (int call = 0; call < 5; call++) {
            AiOcrService.OcrResult result = service.extract(new byte[] {1, 2, 3}, "image/jpeg");
            assertEquals("", result.text());
            assertEquals(0, result.confidence());
            assertTrue(result.unreadable());
        }
    }

    @Test
    void preservesTheUploadedImageMediaTypeForVisionProviders() {
        whenProviderReturns(answers("student answer", .9));

        service.extract(new byte[] {1, 2, 3}, "image/png");

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(
            eq("http://localhost/ocr-test"), entityCaptor.capture(), eq(Map.class)
        );
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
    void rendersTypedWorksheetPdfAndReturnsOnlyTheModelSelectedAnswer() throws IOException {
        whenProviderReturns(answers("x = 42", .96));

        AiOcrService.OcrResult result = service.extract(
            typedPdf(List.of("Worksheet title", "Question 1: solve x", "Instructions: show work", "x = 42")),
            "application/pdf"
        );

        assertEquals("x = 42", result.text());
        assertEquals(.96, result.confidence());
        assertFalse(result.unreadable());
        verify(restTemplate).postForObject(
            eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)
        );
    }

    @Test
    void aggregatesAnswerPagesInOrderAndUsesLowestConfidence() throws IOException {
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(
            providerResponse(answers("first answer", .96)),
            providerResponse(noAnswers(.99)),
            providerResponse(answers("second answer", .72))
        );

        AiOcrService.OcrResult result = service.extract(
            typedPdf(List.of("Question 1", "first answer"), List.of("Question 2"),
                List.of("Question 3", "second answer")),
            "application/pdf"
        );

        assertEquals("first answer\nsecond answer", result.text());
        assertEquals(.72, result.confidence());
        assertFalse(result.unreadable());
        verify(restTemplate, times(3)).postForObject(
            eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)
        );
    }

    @Test
    void rejectsWholePdfWhenAnyPageProviderResponseFails() throws IOException {
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(providerResponse(answers("first answer", .96)))
            .thenThrow(new RestClientException("timeout"));

        AiOcrService.OcrResult result = service.extract(
            typedPdf(List.of("Question 1", "first answer"), List.of("Question 2", "second answer")),
            "application/pdf"
        );

        assertEquals("", result.text());
        assertEquals(0, result.confidence());
        assertTrue(result.unreadable());
    }

    @Test
    void rejectsPdfWhenAllPagesHaveNoAnswers() throws IOException {
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(providerResponse(noAnswers(.99)), providerResponse(noAnswers(.99)));

        AiOcrService.OcrResult result = service.extract(
            typedPdf(List.of("Worksheet title"), List.of("Question 1")),
            "application/pdf"
        );

        assertTrue(result.unreadable());
        assertEquals("", result.text());
        assertEquals(0, result.confidence());
    }

    @Test
    void marksMalformedAndEncryptedPdfsAsUnreadableWithoutCallingProvider() throws IOException {
        AiOcrService.OcrResult malformedPdf = service.extract(new byte[] {1, 2, 3}, "application/pdf");
        AiOcrService.OcrResult encryptedPdf = service.extract(encryptedPdf(), "application/pdf");

        assertTrue(malformedPdf.unreadable());
        assertTrue(encryptedPdf.unreadable());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void rejectsPdfPageAndRenderLimitsBeforeCallingProvider() throws IOException {
        AiOcrService.OcrResult tooManyPages = service.extract(
            pdfWithPageCount(101), "application/pdf"
        );
        AiOcrService.OcrResult oversizedPage = service.extract(
            pdfWithPageSize(10_000, 10_000), "application/pdf"
        );

        assertTrue(tooManyPages.unreadable());
        assertTrue(oversizedPage.unreadable());
        verifyNoInteractions(restTemplate);
    }

    private void whenProviderReturns(String content) {
        when(restTemplate.postForObject(
            eq("http://localhost/ocr-test"), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(providerResponse(content));
    }

    private Map<String, Object> providerResponse(String content) {
        return Map.of("choices", List.of(Map.of("message", Map.of("content", content))));
    }

    private String answers(String text, double confidence) {
        return "{\"status\":\"answers\",\"text\":\"" + text
            + "\",\"confidence\":" + confidence + "}";
    }

    private String noAnswers(double confidence) {
        return "{\"status\":\"no_answers\",\"text\":\"\",\"confidence\":"
            + confidence + "}";
    }

    @SafeVarargs
    private final byte[] typedPdf(List<String>... pageLines) throws IOException {
        try (
            PDDocument document = new PDDocument();
            ByteArrayOutputStream output = new ByteArrayOutputStream()
        ) {
            for (List<String> lines : pageLines) {
                PDPage page = new PDPage();
                document.addPage(page);
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    content.newLineAtOffset(72, 700);
                    for (String line : lines) {
                        content.showText(line);
                        content.newLineAtOffset(0, -18);
                    }
                    content.endText();
                }
            }
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] encryptedPdf() throws IOException {
        try (
            PDDocument document = new PDDocument();
            ByteArrayOutputStream output = new ByteArrayOutputStream()
        ) {
            document.addPage(new PDPage());
            document.protect(new StandardProtectionPolicy(
                "owner-password", "", new AccessPermission()
            ));
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] pdfWithPageCount(int pageCount) throws IOException {
        try (
            PDDocument document = new PDDocument();
            ByteArrayOutputStream output = new ByteArrayOutputStream()
        ) {
            for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                document.addPage(new PDPage());
            }
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] pdfWithPageSize(float width, float height) throws IOException {
        try (
            PDDocument document = new PDDocument();
            ByteArrayOutputStream output = new ByteArrayOutputStream()
        ) {
            document.addPage(new PDPage(new PDRectangle(width, height)));
            document.save(output);
            return output.toByteArray();
        }
    }
}
