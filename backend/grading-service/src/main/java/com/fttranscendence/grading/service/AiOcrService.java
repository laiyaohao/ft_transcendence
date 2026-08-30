package com.fttranscendence.grading.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiOcrService {

    @Value("${ai.engine.url}")
    private String apiUrl;

    @Value("${ai.vision.model}")
    private String visionModel;

    @Value("${ai.engine.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public AiOcrService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * OCR and marking share this provider credential. Reject generated-template
     * values during startup so a deployment cannot appear healthy until its
     * real server-side AI credential has been supplied.
     */
    @PostConstruct
    void validateProviderCredential() {
        validateApiKey(apiKey);
    }

    static void validateApiKey(String candidate) {
        String normalized = candidate == null ? "" : candidate.trim();
        if (normalized.isBlank()
                || normalized.toLowerCase(java.util.Locale.ROOT).contains("change-me")
                || normalized.startsWith("REPLACE_WITH_")) {
            throw new IllegalArgumentException(
                "AI_ENGINE_API_KEY must be a real provider credential, not a placeholder");
        }
    }

    public String extractTextFromImage(String base64Image) {
        return extractBase64(base64Image, "image/jpeg").text();
    }

    public OcrResult extract(byte[] bytes, String mediaType) {
        if (!isSupportedImage(mediaType)) {
            return new OcrResult("Error: OCR accepts JPEG or PNG images only.", 0, true);
        }
        return extractBase64(java.util.Base64.getEncoder().encodeToString(bytes), mediaType);
    }

    private OcrResult extractBase64(String base64Image, String mediaType) {
        // Strict prompt specifically optimized for handwritten math & equations
        String prompt = "You are a precise mathematical OCR engine. " +
                        "Extract all printed text and handwritten calculations exactly as written. " +
                        "Preserve all mathematical operators (+, -, *, /, =) and numbers accurately without skipping symbols. " +
                        "Do not include explanation, preamble, or commentary.";

        List<Map<String, Object>> contentArray = List.of(
            Map.of("type", "text", "text", prompt),
            Map.of("type", "image_url", "image_url", Map.of("url", "data:" + mediaType + ";base64," + base64Image))
        );

        Map<String, Object> userMessage = Map.of("role", "user", "content", contentArray);

        Map<String, Object> requestPayload = Map.of(
            "model", visionModel,
            "messages", List.of(userMessage),
            "temperature", 0.0 // Set to 0.0 for deterministic, literal transcription
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                apiUrl, 
                new HttpEntity<>(requestPayload, headers), 
                Map.class
            );

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                String rawContent = (String) message.get("content");

                // Remove <think>...</think> blocks and trim surrounding whitespace
                String text = cleanModelOutput(rawContent);
                if (text.isBlank()) return new OcrResult("", 0, true);
                return new OcrResult(text, confidence(text), false);
            }
        } catch (Exception e) {
            return new OcrResult("Error: Could not extract text. " + e.getMessage(), 0, true);
        }
        return new OcrResult("Error: Empty response from OCR engine.", 0, true);
    }

    /**
     * Strips internal reasoning tags and cleans whitespace.
     */
    private String cleanModelOutput(String rawText) {
        if (rawText == null) return "";
        // (?s) enables dotall mode so .* matches newlines across multi-line thinking blocks
        return rawText.replaceAll("(?s)<think>.*?</think>", "").trim();
    }
    private double confidence(String text) { return text.matches(".*[A-Za-z0-9].*") ? (text.length() < 8 ? .65 : .94) : .4; }
    private boolean isSupportedImage(String mediaType) {
        return "image/jpeg".equals(mediaType) || "image/png".equals(mediaType);
    }
    public record OcrResult(String text, double confidence, boolean unreadable) { }
}
