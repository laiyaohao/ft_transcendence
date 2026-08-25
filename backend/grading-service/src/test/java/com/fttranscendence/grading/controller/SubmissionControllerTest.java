package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.model.Submission;
import com.fttranscendence.grading.repository.SubmissionRepository;
import com.fttranscendence.grading.service.AiGradingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionControllerTest {

    @Mock private AiGradingService aiGradingService;
    @Mock private SubmissionRepository submissionRepository;

    private SubmissionController controller;

    @BeforeEach
    void setUp() {
        controller = new SubmissionController(aiGradingService, submissionRepository);
    }

    @Test
    void analyzeSubmissionPersistsTheAiResultAgainstTheRequestedStudentAndQuestion() {
        var aiResult = new AiGradingService.AiDiagnosticResult(
            "Partially Correct",
            "Missing key point",
            List.of("conduction"),
            "Explain heat transfer."
        );
        when(aiGradingService.evaluateSubmission(anyString(), anyList(), anyString()))
            .thenReturn(aiResult);

        var response = controller.analyzeSubmission(
            new SubmissionController.SubmissionRequest("question-1", 42L, "Metal gets hot.")
        );

        assertEquals(200, response.getStatusCode().value());
        assertEquals(aiResult, response.getBody());

        ArgumentCaptor<Submission> submissionCaptor = ArgumentCaptor.forClass(Submission.class);
        verify(submissionRepository).save(submissionCaptor.capture());
        Submission saved = submissionCaptor.getValue();
        assertEquals(42L, saved.getStudentId());
        assertEquals("question-1", saved.getQuestionId());
        assertEquals("Metal gets hot.", saved.getStudentAnswer());
        assertEquals("Partially Correct", saved.getCorrectness());
        assertEquals("Missing key point", saved.getErrorCategory());
        assertEquals(List.of("conduction"), saved.getMissingKeywords());
        assertEquals("Explain heat transfer.", saved.getFeedback());
    }

    @Test
    void getAllSubmissionsReturnsRepositoryResults() {
        Submission submission = new Submission();
        when(submissionRepository.findAll()).thenReturn(List.of(submission));

        var response = controller.getAllSubmissions();

        assertEquals(200, response.getStatusCode().value());
        assertEquals(List.of(submission), response.getBody());
        verify(submissionRepository).findAll();
    }
}
