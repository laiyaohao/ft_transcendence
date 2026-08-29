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
    private final RuleBasedAnswerChecker ruleChecker;

    public AiGradingService(RestTemplate restTemplate, ObjectMapper objectMapper, RuleBasedAnswerChecker ruleChecker) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.ruleChecker = ruleChecker;
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

        ApiResponse rawResponse;
        try {
            rawResponse = restTemplate.postForObject(apiUrl, new HttpEntity<>(requestPayload, headers), ApiResponse.class);
        } catch (Exception exception) {
            return diagnosticFallback("AI_UNAVAILABLE");
        }
        if (rawResponse != null && rawResponse.choices() != null && !rawResponse.choices().isEmpty()
            && rawResponse.choices().get(0).message() != null) {
            try {
                AiDiagnosticResult result = objectMapper.readValue(rawResponse.choices().get(0).message().content(), AiDiagnosticResult.class);
                if (isValid(result)) {
                    return new AiDiagnosticResult(result.correctness().trim(), result.errorCategory().trim(),
                        result.missingKeywords().stream().map(String::trim).toList(), result.feedback().trim());
                }
            } catch (Exception exception) {
                return diagnosticFallback("AI_RESPONSE_INVALID");
            }
        }
        return diagnosticFallback("AI_RESPONSE_INVALID");
    }

    private AiDiagnosticResult diagnosticFallback(String category) {
        return new AiDiagnosticResult("Manual review required", category, List.of(),
            "AI advice is unavailable. Review the rubric evidence before approving.");
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
        return evaluateMarking(questionContext, modelAnswer, rubric, List.of(), scoringKeywords, studentAnswer, maximumMarks);
    }

    /**
     * Builds deterministic evidence before asking the provider. The provider
     * receives that evidence as context but remains advisory-only; it cannot
     * alter a persisted result without an explicit Tutor approval.
     */
    public AiMarkingResult evaluateMarking(
        String questionContext,
        String modelAnswer,
        List<String> rubric,
        List<RuleBasedAnswerChecker.WeightedMarkingComponent> markingComponents,
        List<String> scoringKeywords,
        String studentAnswer,
        BigDecimal maximumMarks
    ) {
        if (questionContext == null || questionContext.isBlank() || modelAnswer == null || modelAnswer.isBlank()
            || rubric == null || rubric.isEmpty() || maximumMarks == null || maximumMarks.signum() <= 0) {
            throw new IllegalArgumentException("Question context, rubric, model answer, and maximum marks are required.");
        }
        RuleCheckResult deterministic = markingComponents == null || markingComponents.isEmpty()
            ? unweightedEvidence(studentAnswer, scoringKeywords, maximumMarks)
            : ruleChecker.checkWeighted(studentAnswer, markingComponents, maximumMarks);
        String rubricText = String.join("\n", rubric);
        String systemInstruction = "You are an advisory marking assistant. Never state that a score is final. Respond in pure JSON with suggested_marks, correctness, error_category, missing_keywords, and feedback.";
        String userPrompt = String.format(
            "Question: %s\nModel answer: %s\nMarking criteria:\n%s\nMaximum marks: %s\nDeterministic rubric evidence (advisory; do not override it): %s\nStudent answer: \"%s\"\nReturn a suggested_marks number between 0 and the maximum. Keep feedback concise and actionable.",
            questionContext, modelAnswer, rubricText, maximumMarks, deterministic.explanation(), studentAnswer == null ? "" : studentAnswer
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
                        provider.feedback().trim(), true, deterministic);
                }
            }
            return deterministicFallback(deterministic, "AI_RESPONSE_INVALID");
        } catch (Exception exception) {
            return deterministicFallback(deterministic, "AI_UNAVAILABLE");
        }
    }

    private AiMarkingResult deterministicFallback(RuleCheckResult checked, String category) {
        return new AiMarkingResult(checked.awardedMarks(), "Manual review required", category,
            checked.missingKeywords(), "AI advice is unavailable. Review the deterministic rubric evidence before approving.", false, checked);
    }

    private RuleCheckResult unweightedEvidence(String answer, List<String> scoringKeywords, BigDecimal maximumMarks) {
        if (scoringKeywords == null || scoringKeywords.isEmpty()) {
            return new RuleCheckResult(BigDecimal.ZERO.setScale(2), maximumMarks, List.of(), List.of(),
                "No deterministic rubric targets are configured.", List.of());
        }
        return ruleChecker.check(answer, scoringKeywords, maximumMarks);
    }

    private boolean isValid(ProviderMarking result, BigDecimal maximumMarks) {
        return result != null && result.suggestedMarks() != null && result.suggestedMarks().signum() >= 0
            && result.suggestedMarks().compareTo(maximumMarks) <= 0 && result.correctness() != null
            && !result.correctness().isBlank() && result.feedback() != null && !result.feedback().isBlank();
    }

    private boolean isValid(AiDiagnosticResult result) {
        return result != null && result.correctness() != null && !result.correctness().isBlank()
            && result.errorCategory() != null && !result.errorCategory().isBlank()
            && result.feedback() != null && !result.feedback().isBlank()
            && result.missingKeywords() != null && result.missingKeywords().stream().allMatch(keyword -> keyword != null && !keyword.isBlank());
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
                                  List<String> missingKeywords, String feedback, boolean providerResponseValid,
                                  RuleCheckResult deterministicEvidence) {}
}
