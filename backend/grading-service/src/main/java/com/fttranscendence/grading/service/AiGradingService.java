package com.fttranscendence.grading.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
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

    public record Message(String role, String content) {}
    public record ResponseFormat(String type) {}
    public record ApiRequest(String model, List<Message> messages, @JsonProperty("response_format") ResponseFormat responseFormat) {}
    public record Choice(Message message) {}
    public record ApiResponse(List<Choice> choices) {}
    public record AiDiagnosticResult(String correctness, @JsonProperty("error_category") String errorCategory, @JsonProperty("missing_keywords") List<String> missingKeywords, String feedback) {}
}