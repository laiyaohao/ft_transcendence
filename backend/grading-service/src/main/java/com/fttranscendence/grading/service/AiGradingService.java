package com.fttranscendence.grading.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.List;

@Service
public class AiGradingService {
    @Value("${ai.engine.url}") private String apiUrl;
    @Value("${ai.engine.model}") private String apiModel;
    @Value("${ai.engine.api-key}") private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AiGradingService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public AiDiagnosticResult evaluateSubmission(String questionContext, List<String> rubric, String studentAnswer) {
        StringBuilder rubricString = new StringBuilder();
        for (int i = 0; i < rubric.size(); i++) {
            rubricString.append(i + 1).append(". ").append(rubric.get(i)).append("\n");
        }

        String systemInstruction = "You are a strict grading assistant. Evaluate the student's answer against the rubric. Always respond in pure JSON format.";
        String userPrompt = String.format(
            "Question Context: %s\nExpected Rubric Targets:\n%s\nStudent Answer Content: \"%s\"\n\nRespond with a JSON object containing keys: correctness, error_category, missing_keywords (array), and feedback.",
            questionContext, rubricString.toString(), studentAnswer
        );

        Message systemMessage = new Message("system", systemInstruction);
        Message userMessage = new Message("user", userPrompt);
        ApiRequest requestPayload = new ApiRequest(apiModel, List.of(systemMessage, userMessage), new ResponseFormat("json_object"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        try {
            ApiResponse rawResponse = restTemplate.postForObject(apiUrl, new HttpEntity<>(requestPayload, headers), ApiResponse.class);
            if (rawResponse != null && rawResponse.choices() != null && !rawResponse.choices().isEmpty()) {
                return objectMapper.readValue(rawResponse.choices().get(0).message().content(), AiDiagnosticResult.class);
            }
        } catch (Exception e) {
            System.err.println("Cloud API Engine Failure: " + e.getMessage());
        }
        return new AiDiagnosticResult("Analysis Complete", "Unclassified", List.of(), "System error.");
    }

    /**
     * Produces an advisory only. The returned result is not a final grade and
     * is deliberately persisted as an AI suggestion until a Tutor approves it.
     */
    public AiMarkingResult evaluateMarking(
        String questionContext,
        String modelAnswer,
        List<String> rubric,
        List<String> scoringKeywords,
        String studentAnswer,
        BigDecimal maximumMarks
    ) {
        if (questionContext == null || questionContext.isBlank() || modelAnswer == null || modelAnswer.isBlank()
            || rubric == null || rubric.isEmpty() || maximumMarks == null || maximumMarks.signum() <= 0) {
            throw new IllegalArgumentException("Question context, rubric, model answer, and maximum marks are required.");
        }
        String rubricText = String.join("\n", rubric);
        String systemInstruction = "You are an advisory marking assistant. Never state that a score is final. Respond in pure JSON with suggested_marks, correctness, error_category, missing_keywords, and feedback.";
        String userPrompt = String.format(
            "Question: %s\nModel answer: %s\nMarking criteria:\n%s\nMaximum marks: %s\nStudent answer: \"%s\"\nReturn a suggested_marks number between 0 and the maximum. Keep feedback concise and actionable.",
            questionContext, modelAnswer, rubricText, maximumMarks, studentAnswer == null ? "" : studentAnswer
        );
        ApiRequest request = new ApiRequest(apiModel, List.of(
            new Message("system", systemInstruction), new Message("user", userPrompt)
        ), new ResponseFormat("json_object"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        try {
            ApiResponse response = restTemplate.postForObject(apiUrl, new HttpEntity<>(request, headers), ApiResponse.class);
            if (response != null && response.choices() != null && !response.choices().isEmpty()) {
                ProviderMarking provider = objectMapper.readValue(
                    response.choices().get(0).message().content(), ProviderMarking.class
                );
                if (isValid(provider, maximumMarks)) {
                    return new AiMarkingResult(provider.suggestedMarks().setScale(2), provider.correctness().trim(),
                        blankToNull(provider.errorCategory()), provider.missingKeywords() == null ? List.of() : provider.missingKeywords(),
                        provider.feedback().trim(), true);
                }
            }
            return deterministicFallback(scoringKeywords, studentAnswer, maximumMarks, "AI_RESPONSE_INVALID");
        } catch (Exception exception) {
            return deterministicFallback(scoringKeywords, studentAnswer, maximumMarks, "AI_UNAVAILABLE");
        }
    }

    private AiMarkingResult deterministicFallback(
        List<String> scoringKeywords, String studentAnswer, BigDecimal maximumMarks, String category
    ) {
        if (scoringKeywords != null && !scoringKeywords.isEmpty()) {
            RuleCheckResult checked = new RuleBasedAnswerChecker().check(studentAnswer, scoringKeywords, maximumMarks);
            return new AiMarkingResult(checked.awardedMarks(), "Manual review required", category,
                checked.missingKeywords(), "AI advice is unavailable. Review the deterministic rubric evidence before approving.", false);
        }
        return new AiMarkingResult(BigDecimal.ZERO.setScale(2), "Manual review required", category, List.of(),
            "AI advice is unavailable. A Tutor must review this answer before approving.", false);
    }

    private boolean isValid(ProviderMarking result, BigDecimal maximumMarks) {
        return result != null && result.suggestedMarks() != null && result.suggestedMarks().signum() >= 0
            && result.suggestedMarks().compareTo(maximumMarks) <= 0 && result.correctness() != null
            && !result.correctness().isBlank() && result.feedback() != null && !result.feedback().isBlank();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record Message(String role, String content) {}
    public record ResponseFormat(String type) {}
    public record ApiRequest(String model, List<Message> messages, @JsonProperty("response_format") ResponseFormat responseFormat) {}
    public record Choice(Message message) {}
    public record ApiResponse(List<Choice> choices) {}
    public record AiDiagnosticResult(String correctness, @JsonProperty("error_category") String errorCategory, @JsonProperty("missing_keywords") List<String> missingKeywords, String feedback) {}
    public record ProviderMarking(@JsonProperty("suggested_marks") BigDecimal suggestedMarks, String correctness,
                                  @JsonProperty("error_category") String errorCategory,
                                  @JsonProperty("missing_keywords") List<String> missingKeywords, String feedback) {}
    public record AiMarkingResult(BigDecimal suggestedMarks, String correctness, String errorCategory,
                                  List<String> missingKeywords, String feedback, boolean providerResponseValid) {}
}
