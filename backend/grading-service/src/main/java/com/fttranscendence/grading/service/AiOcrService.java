package com.fttranscendence.grading.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final String JPEG_MEDIA_TYPE = "image/jpeg";
    private static final String PNG_MEDIA_TYPE = "image/png";
    private static final double LEGACY_TRANSCRIPTION_CONFIDENCE = .85;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String OCR_PROMPT =
        "You are a precise mathematical OCR engine. "
            + "Extract all printed text and handwritten calculations exactly as written. "
            + "Preserve all mathematical operators (+, -, *, /, =) and numbers accurately "
            + "without skipping symbols. "
            + "Assess the visual legibility and recognition certainty of the transcription, not its "
            + "length. Return only a JSON object with text and confidence fields. text must be the "
            + "literal transcription. confidence must be a number from 0 to 1, where 1 means every "
            + "visible character is clear and confidently recognized, and 0 means unreadable. "
            + "Do not include explanation, preamble, or commentary.";

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
        String normalizedCredential = candidate == null ? "" : candidate.trim();
        boolean isBlankCredential = normalizedCredential.isBlank();
        boolean containsTemplateValue = normalizedCredential
            .toLowerCase(java.util.Locale.ROOT)
            .contains("change-me");
        boolean usesReplacementPlaceholder = normalizedCredential
            .startsWith("REPLACE_WITH_");

        if (
            isBlankCredential
                || containsTemplateValue
                || usesReplacementPlaceholder
        ) {
            throw new IllegalArgumentException(
                "AI_ENGINE_API_KEY must be a real provider credential, not a placeholder"
            );
        }
    }

    public String extractTextFromImage(String base64Image) {
        return extractBase64(base64Image, JPEG_MEDIA_TYPE).text();
    }

    public OcrResult extract(byte[] bytes, String mediaType) {
        if (!isSupportedImage(mediaType)) {
            return new OcrResult("Error: OCR accepts JPEG or PNG images only.", 0, true);
        }

        String base64Image = java.util.Base64.getEncoder().encodeToString(bytes);
        return extractBase64(base64Image, mediaType);
    }

    private OcrResult extractBase64(String base64Image, String mediaType) {
        Map<String, Object> requestPayload = buildOcrRequest(
            base64Image,
            mediaType
        );
        HttpHeaders headers = createProviderHeaders();

        try {
            Map<String, Object> providerResponse = restTemplate.postForObject(
                apiUrl,
                new HttpEntity<>(requestPayload, headers),
                Map.class
            );

            if (providerResponse != null && providerResponse.containsKey("choices")) {
                String rawContent = extractFirstChoiceContent(providerResponse);
                ParsedOcrOutput ocrOutput = parseModelOutput(rawContent);
                String extractedText = ocrOutput.text();

                if (extractedText.isBlank()) {
                    return new OcrResult("", 0, true);
                }

                return new OcrResult(
                    extractedText,
                    ocrOutput.confidence(),
                    false
                );
            }
        } catch (Exception exception) {
            return new OcrResult(
                "Error: Could not extract text. " + exception.getMessage(),
                0,
                true
            );
        }

        return new OcrResult("Error: Empty response from OCR engine.", 0, true);
    }

    private Map<String, Object> buildOcrRequest(
        String base64Image,
        String mediaType
    ) {
        List<Map<String, Object>> messageContent = List.of(
            Map.of("type", "text", "text", OCR_PROMPT),
            Map.of(
                "type", "image_url",
                "image_url",
                Map.of("url", "data:" + mediaType + ";base64," + base64Image)
            )
        );
        Map<String, Object> userMessage = Map.of(
            "role",
            "user",
            "content",
            messageContent
        );

        // Literal transcription must remain deterministic for tutor review.
        return Map.of(
            "model",
            visionModel,
            "messages",
            List.of(userMessage),
            "temperature",
            0.0
        );
    }

    private HttpHeaders createProviderHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        return headers;
    }

    @SuppressWarnings("unchecked")
    private String extractFirstChoiceContent(Map<String, Object> providerResponse) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) providerResponse
            .get("choices");
        Map<String, Object> firstMessage = (Map<String, Object>) choices
            .get(0)
            .get("message");
        return (String) firstMessage.get("content");
    }

    private ParsedOcrOutput parseModelOutput(String rawContent) {
        String cleanedContent = cleanModelOutput(rawContent);
        if (cleanedContent.isBlank()) {
            return new ParsedOcrOutput("", 0);
        }

        try {
            JsonNode output = OBJECT_MAPPER.readTree(cleanedContent);
            if (output.isObject() && output.path("text").isTextual()) {
                String text = cleanModelOutput(output.path("text").textValue());
                return new ParsedOcrOutput(text, parseModelConfidence(output.path("confidence")));
            }
        } catch (JsonProcessingException ignored) {
            // Older providers return the literal transcription rather than JSON.
        }

        // A valid legacy transcription has no model confidence. Keep it usable
        // without treating a short answer as uncertain solely because it is short.
        return new ParsedOcrOutput(cleanedContent, LEGACY_TRANSCRIPTION_CONFIDENCE);
    }

    private double parseModelConfidence(JsonNode confidenceNode) {
        if (!confidenceNode.isNumber()) {
            return LEGACY_TRANSCRIPTION_CONFIDENCE;
        }

        double confidence = confidenceNode.doubleValue();
        if (!Double.isFinite(confidence) || confidence < 0 || confidence > 1) {
            return LEGACY_TRANSCRIPTION_CONFIDENCE;
        }

        return confidence;
    }

    /**
     * Strips internal reasoning tags and cleans whitespace.
     */
    private String cleanModelOutput(String rawText) {
        if (rawText == null) {
            return "";
        }

        // Dotall lets the expression remove reasoning blocks that span lines.
        return rawText.replaceAll("(?s)<think>.*?</think>", "").trim();
    }

    private boolean isSupportedImage(String mediaType) {
        return JPEG_MEDIA_TYPE.equals(mediaType) || PNG_MEDIA_TYPE.equals(mediaType);
    }

    public record OcrResult(String text, double confidence, boolean unreadable) {
    }

    private record ParsedOcrOutput(String text, double confidence) {
    }
}
