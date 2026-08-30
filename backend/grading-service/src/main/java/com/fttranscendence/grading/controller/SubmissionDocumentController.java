package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.model.SubmissionPage;
import com.fttranscendence.grading.ocr.OcrExtraction;
import com.fttranscendence.grading.ocr.OcrReviewService;
import com.fttranscendence.grading.repository.SubmissionDocumentRepository;
import com.fttranscendence.grading.security.AuthenticatedUser;
import com.fttranscendence.grading.service.LearningAuthorizationClient;
import com.fttranscendence.grading.storage.DocumentStorage;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.IntStream;

/** Stores source pages only after learning-service authorizes the target student. */
@RestController
@RequestMapping("/api/grading/submission-documents")
public class SubmissionDocumentController {
    private final SubmissionDocumentRepository documents;
    private final DocumentStorage storage;
    private final OcrReviewService review;
    private final LearningAuthorizationClient authorization;

    public SubmissionDocumentController(
        SubmissionDocumentRepository documents,
        DocumentStorage storage,
        OcrReviewService review,
        LearningAuthorizationClient authorization
    ) {
        this.documents = documents;
        this.storage = storage;
        this.review = review;
        this.authorization = authorization;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> create(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam long studentId,
        @RequestParam long worksheetId,
        @RequestParam(required = false) Long worksheetQuestionId,
        @RequestParam(required = false) Long classId,
        @RequestParam("files") List<MultipartFile> files
    ) throws Exception {
        // Students must resolve to themselves; Tutors must resolve to a student
        // in their own learning-service scope.  The grading service never trusts
        // a client-supplied studentId without this check.
        if ("TUTOR".equals(user.role()) && (classId == null || classId <= 0)) {
            throw new IllegalArgumentException("Tutors must select the student's class.");
        }
        authorization.assertCanSubmit(user, studentId, worksheetId, worksheetQuestionId, classId);
        if (files.isEmpty()) {
            throw new IllegalArgumentException("At least one page is required.");
        }
        boolean pdf = files.stream().anyMatch(file -> "application/pdf".equals(file.getContentType()));
        if (pdf && files.size() != 1) {
            throw new IllegalArgumentException("A PDF submission must be uploaded alone.");
        }

        SubmissionDocument document = new SubmissionDocument(
            user.userId(),
            SubmissionDocument.OwnerRole.valueOf(user.role()),
            worksheetId,
            studentId,
            pdf ? SubmissionDocument.SourceType.PDF : SubmissionDocument.SourceType.IMAGES
        );
        // Repository.save may merge and return a different managed aggregate.
        // Keep that instance so subsequent OCR extractions always reference
        // persisted SubmissionPage records rather than detached transient pages.
        document = documents.saveAndFlush(document);
        for (MultipartFile file : files) {
            document.addPage(storage.store(
                user.userId(),
                Objects.requireNonNullElse(file.getOriginalFilename(), "page"),
                file.getContentType(),
                file.getBytes()
            ));
        }
        document = documents.saveAndFlush(document);

        List<OcrExtraction> extractions = new ArrayList<>();
        for (SubmissionPage page : document.getPages()) {
            extractions.add(review.extract(
                page,
                worksheetQuestionId,
                storage.read(user.userId(), page.getStorageKey())
            ));
        }
        document.markReady();
        documents.saveAndFlush(document);
        return ResponseEntity.status(HttpStatus.CREATED).body(DocumentResponse.of(document, extractions));
    }

    public record PageResponse(
        long id,
        int pageNumber,
        long extractionId,
        String text,
        double confidence,
        String status
    ) { }

    public record DocumentResponse(long id, List<PageResponse> pages) {
        static DocumentResponse of(SubmissionDocument document, List<OcrExtraction> extractions) {
            return new DocumentResponse(
                document.getId(),
                IntStream.range(0, extractions.size())
                    .mapToObj(index -> {
                        OcrExtraction extraction = extractions.get(index);
                        return new PageResponse(
                            document.getPages().get(index).getId(),
                            document.getPages().get(index).getPageNumber(),
                            extraction.getId(),
                            extraction.getCorrectedText() == null
                                ? extraction.getExtractedText()
                                : extraction.getCorrectedText(),
                            extraction.getConfidence(),
                            extraction.getStatus().name()
                        );
                    })
                    .toList()
            );
        }
    }

    @ExceptionHandler(LearningAuthorizationClient.Forbidden.class)
    ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("code", "SUBMISSION_FORBIDDEN", "error", "You are not allowed to submit for this student."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> bad(IllegalArgumentException exception) {
        return ResponseEntity.badRequest()
            .body(Map.of("code", "INVALID_SUBMISSION_DOCUMENT", "error", exception.getMessage()));
    }
}
