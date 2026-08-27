package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.model.Submission;
import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.ocr.OcrExtraction;
import com.fttranscendence.grading.repository.OcrExtractionRepository;
import com.fttranscendence.grading.repository.SubmissionDocumentRepository;
import com.fttranscendence.grading.repository.SubmissionRepository;
import com.fttranscendence.grading.security.AuthenticatedUser;
import com.fttranscendence.grading.service.MarkingReviewService;
import com.fttranscendence.grading.storage.DocumentStorage;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.ExpectedCount.manyTimes;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@SpringBootTest(properties = "learning.service.url=http://localhost/learning")
@Transactional
class MarkingApprovalIntegrationTest {
    private static final AuthenticatedUser TUTOR = new AuthenticatedUser(101L, "tutor@example.com", "TUTOR");

    @Autowired private MarkingReviewService service;
    @Autowired private SubmissionDocumentRepository documents;
    @Autowired private OcrExtractionRepository extractions;
    @Autowired private SubmissionRepository submissions;
    @Autowired private RestTemplate restTemplate;

    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        server = MockRestServiceServer.bindTo(restTemplate).ignoreExpectOrder(true).build();
    }

    @Test
    void aiSuggestionStaysPendingUntilTutorApprovesAndDuplicateApprovalIsIdempotent() {
        SubmissionDocument document = readyDocument();
        extractions.saveAndFlush(new OcrExtraction(document.getPages().get(0), 401L,
            "Metal is a conductor.", 0.95, "mock"));
        expectTutorAndQuestion();
        server.expect(once(), requestTo("http://localhost/ai-test")).andExpect(method(org.springframework.http.HttpMethod.POST))
            .andRespond(withSuccess(providerResult(), MediaType.APPLICATION_JSON));

        MarkingReviewService.MarkingReview pending = service.createAdvisoryReview(TUTOR, "Bearer token",
            new MarkingReviewService.CreateRequest(document.getId(), 401L, 501L));

        assertEquals(Submission.ReviewStatus.PENDING_REVIEW, pending.reviewStatus());
        assertEquals(new BigDecimal("1.50"), pending.aiSuggestedMarks());
        assertNull(pending.approvedMarks());
        assertEquals(0, pending.history().size());
        server.verify();

        server.reset();
        expectTutorOnly();
        MarkingReviewService.MarkingReview approved = service.approve(TUTOR, "Bearer token", pending.id(),
            new MarkingReviewService.ApprovalRequest(new BigDecimal("2.00"), "Tutor checked the explanation."));
        assertEquals(Submission.ReviewStatus.APPROVED, approved.reviewStatus());
        assertEquals(new BigDecimal("2.00"), approved.approvedMarks());
        assertEquals(1, approved.history().size());
        server.verify();

        server.reset();
        expectTutorOnly();
        MarkingReviewService.MarkingReview duplicate = service.approve(TUTOR, "Bearer token", pending.id(),
            new MarkingReviewService.ApprovalRequest(new BigDecimal("2.00"), "Tutor checked the explanation."));
        assertEquals(1, duplicate.history().size());
        assertEquals(1, submissions.findById(pending.id()).orElseThrow().getReviews().size());
        server.verify();
    }

    @Test
    void flagsAndResetsWithoutCreatingFinalMarksAndRejectsNonTutorReviewers() {
        SubmissionDocument document = readyDocument();
        extractions.saveAndFlush(new OcrExtraction(document.getPages().get(0), 402L,
            "Need more work", 0.95, "mock"));
        expectTutorAndQuestion();
        server.expect(once(), requestTo("http://localhost/ai-test")).andRespond(withSuccess(providerResult(), MediaType.APPLICATION_JSON));
        MarkingReviewService.MarkingReview pending = service.createAdvisoryReview(TUTOR, "Bearer token",
            new MarkingReviewService.CreateRequest(document.getId(), 402L, 501L));
        server.verify();

        server.reset();
        expectTutorOnly();
        MarkingReviewService.MarkingReview flagged = service.flag(TUTOR, "Bearer token", pending.id(),
            new MarkingReviewService.FlagRequest("Handwriting is unclear."));
        assertEquals(Submission.ReviewStatus.FLAGGED, flagged.reviewStatus());
        assertNull(flagged.approvedMarks());
        server.verify();

        server.reset();
        expectTutorOnly();
        MarkingReviewService.MarkingReview reset = service.reset(TUTOR, "Bearer token", pending.id());
        assertEquals(Submission.ReviewStatus.PENDING_REVIEW, reset.reviewStatus());
        assertNull(reset.approvedMarks());
        server.verify();

        assertThrows(RuntimeException.class, () -> service.get(
            new AuthenticatedUser(201L, "student@example.com", "STUDENT"), "Bearer token", pending.id()));
    }

    private SubmissionDocument readyDocument() {
        SubmissionDocument document = new SubmissionDocument(101L, SubmissionDocument.OwnerRole.TUTOR,
            301L, 201L, SubmissionDocument.SourceType.IMAGES);
        document.addPage(new DocumentStorage.StoredFile("101/page.png", "page.png", "image/png", 32,
            "b".repeat(64)));
        document.markReady();
        return documents.saveAndFlush(document);
    }

    private void expectTutorAndQuestion() {
        expectTutorOnly();
        server.expect(once(), requestTo("http://localhost/learning/api/learning/tutor/questions/501"))
            .andRespond(withSuccess(question(), MediaType.APPLICATION_JSON));
    }

    private void expectTutorOnly() {
        server.expect(manyTimes(), requestTo("http://localhost/learning/api/learning/tutor/students/201"))
            .andRespond(withSuccess("{\"id\":201}", MediaType.APPLICATION_JSON));
    }

    private String question() {
        return """
            {"id":501,"prompt":"Why does metal feel hot?","totalMarks":2,"modelAnswer":"Metal conducts heat.","keywords":["conductor"],"markingComponents":[{"position":0,"description":"Explains heat conduction","marks":2}]}
            """;
    }

    private String providerResult() {
        return """
            {"choices":[{"message":{"role":"assistant","content":"{\\\"suggested_marks\\\":1.5,\\\"correctness\\\":\\\"Partially correct\\\",\\\"error_category\\\":\\\"Missing detail\\\",\\\"missing_keywords\\\":[\\\"heat transfer\\\"],\\\"feedback\\\":\\\"Explain heat transfer.\\\"}"}}]}
            """;
    }
}
