package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.model.Submission;
import com.fttranscendence.grading.repository.SubmissionRepository;
import com.fttranscendence.grading.service.AiGradingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/grading")
public class SubmissionController {
    private final AiGradingService aiGradingService;
    private final SubmissionRepository submissionRepository;

    public SubmissionController(AiGradingService aiGradingService, SubmissionRepository submissionRepository) {
        this.aiGradingService = aiGradingService;
        this.submissionRepository = submissionRepository;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AiGradingService.AiDiagnosticResult> analyzeSubmission(@RequestBody SubmissionRequest request) {
        String questionContext = "Why does a metal spoon feel hotter than a wooden spoon when placed in hot soup?";
        List<String> rubric = List.of(
            "Identify that metal is a better conductor of heat than wood.",
            "State that heat is transferred faster from the soup to the hand through the metal spoon."
        );

        AiGradingService.AiDiagnosticResult result = aiGradingService.evaluateSubmission(questionContext, rubric, request.studentAnswer());

        Submission submission = new Submission();
        submission.setStudentId(request.studentId()); 
        submission.setQuestionId(request.questionId());
        submission.setStudentAnswer(request.studentAnswer());
        submission.setCorrectness(result.correctness());
        submission.setErrorCategory(result.errorCategory());
        submission.setMissingKeywords(result.missingKeywords());
        submission.setFeedback(result.feedback());
        
        submissionRepository.save(submission);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionRepository.findAll());
    }

    public record SubmissionRequest(String questionId, Long studentId, String studentAnswer) {}
}