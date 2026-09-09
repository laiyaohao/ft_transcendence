package com.fttranscendence.grading.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class AiOcrService {

    private static final String JPEG_MEDIA_TYPE = "image/jpeg";
    private static final String PNG_MEDIA_TYPE = "image/png";
    private static final String PDF_MEDIA_TYPE = "application/pdf";
    private static final int MAX_PDF_PAGES = 100;
    private static final int PDF_RENDER_DPI = 144;
    private static final long MAX_RENDERED_PDF_PIXELS = 20_000_000L;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String OCR_PROMPT =
        "You are an answer-only OCR engine for submitted worksheets. "
            + "Transcribe only content authored by the student: handwritten or typed answers, "
            + "calculations, diagrams labels, and working. Exclude every printed or template "
            + "element, including titles, questions, instructions, examples, answer labels, "
            + "headers, and worksheet text. Do not solve, correct, infer, or paraphrase anything. "
            + "For example, if a page says printed 'Question 1: What is 2 + 2?' and the student "
            + "writes '4', return only '4'. "
            + "Return exactly one JSON object with exactly these fields: status, text, confidence. "
            + "status must be 'answers', 'no_answers', or 'uncertain'. For 'answers', text must be "
            + "the literal student-authored transcription and confidence must be a number from 0 to 1. "
            + "For 'no_answers', text must be empty and confidence must still be a number from 0 to 1. "
            + "Use 'uncertain' if you cannot reliably separate student work from printed content or "
            + "cannot read it. Do not include markdown, explanation, preamble, or commentary.";

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

        if (isBlankCredential || containsTemplateValue || usesReplacementPlaceholder) {
            throw new IllegalArgumentException(
                "AI_ENGINE_API_KEY must be a real provider credential, not a placeholder"
            );
        }
    }

    public String extractTextFromImage(String base64Image) {
        return toOcrResult(extractBase64(base64Image, JPEG_MEDIA_TYPE)).text();
    }

    public OcrResult extract(byte[] bytes, String mediaType) {
        if (PDF_MEDIA_TYPE.equals(mediaType)) {
            return extractPdfPages(bytes);
        }

        if (!isSupportedImage(mediaType)) {
            return unreadable();
        }

        String base64Image = Base64.getEncoder().encodeToString(bytes);
        return toOcrResult(extractBase64(base64Image, mediaType));
    }

    private OcrResult extractPdfPages(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) {
            return unreadable();
        }

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            if (document.isEncrypted() || !hasSupportedPageCount(document)) {
                return unreadable();
            }

            PDFRenderer renderer = new PDFRenderer(document);
            List<String> answerPages = new ArrayList<>();
            double lowestConfidence = 1;

            for (int pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
                if (!canRenderWithinLimit(document.getPage(pageIndex))) {
                    return unreadable();
                }

                byte[] pageImage = renderPdfPage(renderer, pageIndex);
                ModelOcrOutput pageOutput = extractBase64(
                    Base64.getEncoder().encodeToString(pageImage),
                    JPEG_MEDIA_TYPE
                );

                if (pageOutput.status() == OcrStatus.INVALID
                    || pageOutput.status() == OcrStatus.UNCERTAIN) {
                    return unreadable();
                }

                if (pageOutput.status() == OcrStatus.ANSWERS) {
                    answerPages.add(pageOutput.text());
                    lowestConfidence = Math.min(lowestConfidence, pageOutput.confidence());
                }
            }

            if (answerPages.isEmpty()) {
                return unreadable();
            }

            return new OcrResult(String.join("\n", answerPages), lowestConfidence, false);
        } catch (Exception exception) {
            return unreadable();
        }
    }

    private boolean hasSupportedPageCount(PDDocument document) {
        int pageCount = document.getNumberOfPages();
        return pageCount > 0 && pageCount <= MAX_PDF_PAGES;
    }

    private boolean canRenderWithinLimit(org.apache.pdfbox.pdmodel.PDPage page) {
        PDRectangle cropBox = page.getCropBox();
        double widthPoints = cropBox.getWidth();
        double heightPoints = cropBox.getHeight();
        int rotation = Math.floorMod(page.getRotation(), 360);

        if (rotation == 90 || rotation == 270) {
            double originalWidth = widthPoints;
            widthPoints = heightPoints;
            heightPoints = originalWidth;
        }

        long widthPixels = (long) Math.ceil(widthPoints * PDF_RENDER_DPI / 72);
        long heightPixels = (long) Math.ceil(heightPoints * PDF_RENDER_DPI / 72);
        return widthPixels > 0
            && heightPixels > 0
            && widthPixels <= Integer.MAX_VALUE
            && heightPixels <= Integer.MAX_VALUE
            && widthPixels <= MAX_RENDERED_PDF_PIXELS / heightPixels;
    }

    private byte[] renderPdfPage(PDFRenderer renderer, int pageIndex) throws IOException {
        BufferedImage renderedPage = renderer.renderImageWithDPI(
            pageIndex,
            PDF_RENDER_DPI,
            ImageType.RGB
        );

        if ((long) renderedPage.getWidth() * renderedPage.getHeight() > MAX_RENDERED_PDF_PIXELS) {
            throw new IOException("Rendered PDF page exceeds image size limit");
        }

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (!ImageIO.write(renderedPage, "jpeg", output)) {
                throw new IOException("JPEG encoder is unavailable");
            }
            return output.toByteArray();
        }
    }

    private ModelOcrOutput extractBase64(String base64Image, String mediaType) {
        Map<String, Object> requestPayload = buildOcrRequest(base64Image, mediaType);
        HttpHeaders headers = createProviderHeaders();

        try {
            Map<String, Object> providerResponse = restTemplate.postForObject(
                apiUrl,
                new HttpEntity<>(requestPayload, headers),
                Map.class
            );

            if (providerResponse == null || !providerResponse.containsKey("choices")) {
                return ModelOcrOutput.invalid();
            }

            return parseModelOutput(extractFirstChoiceContent(providerResponse));
        } catch (Exception exception) {
            return ModelOcrOutput.invalid();
        }
    }

    private OcrResult toOcrResult(ModelOcrOutput output) {
        if (output.status() != OcrStatus.ANSWERS) {
            return unreadable();
        }

        return new OcrResult(output.text(), output.confidence(), false);
    }

    private OcrResult unreadable() {
        return new OcrResult("", 0, true);
    }

    private Map<String, Object> buildOcrRequest(String base64Image, String mediaType) {
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

    private ModelOcrOutput parseModelOutput(String rawContent) {
        String cleanedContent = cleanModelOutput(rawContent);
        if (cleanedContent.isBlank()) {
            return ModelOcrOutput.invalid();
        }

        try {
            JsonNode output = OBJECT_MAPPER.readTree(cleanedContent);
            if (!output.isObject() || output.size() != 3) {
                return ModelOcrOutput.invalid();
            }

            JsonNode statusNode = output.get("status");
            JsonNode textNode = output.get("text");
            JsonNode confidenceNode = output.get("confidence");
            if (statusNode == null
                || textNode == null
                || !statusNode.isTextual()
                || !textNode.isTextual()
                || !isNormalizedConfidence(confidenceNode)) {
                return ModelOcrOutput.invalid();
            }

            String text = cleanModelOutput(textNode.textValue());
            double confidence = confidenceNode.doubleValue();
            return switch (statusNode.textValue()) {
                case "answers" -> text.isBlank()
                    ? ModelOcrOutput.invalid()
                    : new ModelOcrOutput(OcrStatus.ANSWERS, text, confidence);
                case "no_answers" -> text.isBlank()
                    ? new ModelOcrOutput(OcrStatus.NO_ANSWERS, "", confidence)
                    : ModelOcrOutput.invalid();
                case "uncertain" -> new ModelOcrOutput(OcrStatus.UNCERTAIN, "", 0);
                default -> ModelOcrOutput.invalid();
            };
        } catch (JsonProcessingException exception) {
            return ModelOcrOutput.invalid();
        }
    }

    private boolean isNormalizedConfidence(JsonNode confidenceNode) {
        if (confidenceNode == null || !confidenceNode.isNumber()) {
            return false;
        }

        double confidence = confidenceNode.doubleValue();
        return Double.isFinite(confidence) && confidence >= 0 && confidence <= 1;
    }

    private String cleanModelOutput(String rawText) {
        if (rawText == null) {
            return "";
        }

        return rawText.trim();
    }

    private boolean isSupportedImage(String mediaType) {
        return JPEG_MEDIA_TYPE.equals(mediaType) || PNG_MEDIA_TYPE.equals(mediaType);
    }

    public record OcrResult(String text, double confidence, boolean unreadable) {
    }

    private enum OcrStatus {
        ANSWERS,
        NO_ANSWERS,
        UNCERTAIN,
        INVALID
    }

    private record ModelOcrOutput(OcrStatus status, String text, double confidence) {

        private static ModelOcrOutput invalid() {
            return new ModelOcrOutput(OcrStatus.INVALID, "", 0);
        }
    }
}
