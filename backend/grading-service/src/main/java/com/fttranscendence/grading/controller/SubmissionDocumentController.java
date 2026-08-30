package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.model.SubmissionPage;
import com.fttranscendence.grading.ocr.OcrExtraction;
import com.fttranscendence.grading.ocr.OcrReviewService;
import com.fttranscendence.grading.repository.OcrExtractionRepository;
import com.fttranscendence.grading.repository.SubmissionDocumentRepository;
import com.fttranscendence.grading.security.AuthenticatedUser;
import com.fttranscendence.grading.service.LearningAuthorizationClient;
import com.fttranscendence.grading.storage.DocumentStorage;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Stores source pages only after learning-service authorizes the target student. */
@RestController
@RequestMapping("/api/grading/submission-documents")
public class SubmissionDocumentController {
    private final SubmissionDocumentRepository documents;
    private final DocumentStorage storage;
    private final OcrReviewService review;
    private final LearningAuthorizationClient authorization;
    private final OcrExtractionRepository extractions;

    public SubmissionDocumentController(
        SubmissionDocumentRepository documents,
        DocumentStorage storage,
        OcrReviewService review,
        LearningAuthorizationClient authorization,
        OcrExtractionRepository extractions
    ) {
        this.documents = documents;
        this.storage = storage;
        this.review = review;
        this.authorization = authorization;
        this.extractions = extractions;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional(rollbackFor = Exception.class)
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
            classId,
            pdf ? SubmissionDocument.SourceType.PDF : SubmissionDocument.SourceType.IMAGES
        );
        // Repository.save may merge and return a different managed aggregate.
        // Keep that instance so subsequent OCR extractions always reference
        // persisted SubmissionPage records rather than detached transient pages.
        document = documents.saveAndFlush(document);
        List<String> storedKeys = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                DocumentStorage.StoredFile stored = storage.store(
                    user.userId(),
                    Objects.requireNonNullElse(file.getOriginalFilename(), "page"),
                    file.getContentType(),
                    file.getBytes()
                );
                storedKeys.add(stored.storageKey());
                document.addPage(stored);
            }
            document = documents.saveAndFlush(document);

            List<OcrExtraction> documentExtractions = new ArrayList<>();
            for (SubmissionPage page : document.getPages()) {
                documentExtractions.add(review.extract(
                    page,
                    worksheetQuestionId,
                    storage.read(user.userId(), page.getStorageKey())
                ));
            }
            document.markReady();
            documents.saveAndFlush(document);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(DocumentResponse.of(document, documentExtractions));
        } catch (Exception exception) {
            // Database changes are rolled back by @Transactional; remove any
            // already-written bytes too so a failed OCR attempt leaves no
            // orphaned upload data behind.
            for (String storageKey : storedKeys) {
                try {
                    storage.delete(user.userId(), storageKey);
                } catch (RuntimeException ignored) {
                    // Preserve the original validation/storage/OCR failure.
                }
            }
            throw exception;
        }
    }

    /**
     * OCR review is resumed from durable server-side document/page state, not
     * from browser memory or a client-supplied worksheet context.
     */
    @GetMapping("/{documentId}")
    @Transactional(readOnly = true)
    public DocumentResponse get(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable long documentId
    ) {
        SubmissionDocument document = documents.findByIdAndOwnerUserId(documentId, user.userId())
            .orElseThrow(DocumentNotFound::new);
        return DocumentResponse.of(
            document,
            extractions.findByPageDocumentIdOrderByPagePageNumberAsc(documentId)
        );
    }

    public record PageResponse(
        long id,
        int pageNumber,
        String originalFilename,
        String mediaType,
        long extractionId,
        String text,
        double confidence,
        String status
    ) { }

    public record DocumentResponse(
        long id,
        Long classId,
        long studentId,
        long worksheetId,
        Long uploadedByTutorId,
        String status,
        LocalDateTime createdAt,
        List<PageResponse> pages
    ) {
        static DocumentResponse of(SubmissionDocument document, List<OcrExtraction> extractions) {
            Map<Long, OcrExtraction> extractionsByPageId = extractions.stream()
                .collect(Collectors.toMap(
                    extraction -> extraction.getPage().getId(),
                    Function.identity()
                ));
            return new DocumentResponse(
                document.getId(),
                document.getClassId(),
                document.getStudentId(),
                document.getWorksheetId(),
                document.getOwnerRole() == SubmissionDocument.OwnerRole.TUTOR
                    ? document.getOwnerUserId()
                    : null,
                document.getStatus().name(),
                document.getCreatedAt(),
                document.getPages().stream()
                    .map(page -> {
                        OcrExtraction extraction = extractionsByPageId.get(page.getId());
                        if (extraction == null) {
                            throw new IllegalStateException("Submission page is missing its OCR extraction");
                        }
                        return new PageResponse(
                            page.getId(),
                            page.getPageNumber(),
                            page.getOriginalFilename(),
                            page.getMediaType(),
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

    private static final class DocumentNotFound extends RuntimeException { }

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

    @ExceptionHandler(DocumentNotFound.class)
    ResponseEntity<Map<String, String>> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("code", "SUBMISSION_DOCUMENT_NOT_FOUND", "error", "Submission document was not found."));
    }
}
