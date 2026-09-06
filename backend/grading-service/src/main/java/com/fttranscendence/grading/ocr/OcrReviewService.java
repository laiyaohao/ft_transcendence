package com.fttranscendence.grading.ocr;

import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.model.SubmissionPage;
import com.fttranscendence.grading.repository.OcrExtractionRepository;
import com.fttranscendence.grading.service.AiOcrService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OcrReviewService {

    private static final String AI_VISION_PROVIDER = "ai-vision";

    private final OcrExtractionRepository extractionRepository;
    private final AiOcrService ocrService;

    public OcrReviewService(
        OcrExtractionRepository extractionRepository,
        AiOcrService ocrService
    ) {
        this.extractionRepository = extractionRepository;
        this.ocrService = ocrService;
    }

    @Transactional
    public OcrExtraction extract(
        SubmissionPage page,
        Long questionId,
        byte[] bytes
    ) {
        AiOcrService.OcrResult ocrResult = ocrService.extract(
            bytes,
            page.getMediaType()
        );
        String storedText = ocrResult.unreadable() ? "" : ocrResult.text();

        OcrExtraction extraction = new OcrExtraction(
            page,
            questionId,
            storedText,
            ocrResult.confidence(),
            AI_VISION_PROVIDER
        );

        return extractionRepository.save(extraction);
    }

    @Transactional
    public OcrExtraction correct(
        long ownerId,
        String ownerRole,
        long extractionId,
        String text
    ) {
        OcrExtraction extraction = extractionRepository.findById(extractionId)
            .orElseThrow(NotFound::new);
        SubmissionDocument.OwnerRole requestedOwnerRole = parseOwnerRole(ownerRole);

        ensureOwnerMatches(extraction, ownerId, requestedOwnerRole);
        ensureDocumentIsReadyForCorrection(extraction);
        ensureCorrectedTextIsPresent(text);

        extraction.correct(text);
        return extraction;
    }

    private SubmissionDocument.OwnerRole parseOwnerRole(String ownerRole) {
        try {
            return SubmissionDocument.OwnerRole.valueOf(ownerRole);
        } catch (RuntimeException exception) {
            throw new NotFound();
        }
    }

    private void ensureOwnerMatches(
        OcrExtraction extraction,
        long ownerId,
        SubmissionDocument.OwnerRole ownerRole
    ) {
        SubmissionDocument document = extraction.getPage().getDocument();
        if (!document.getOwnerUserId().equals(ownerId)) {
            throw new NotFound();
        }

        if (document.getOwnerRole() != ownerRole) {
            throw new NotFound();
        }
    }

    private void ensureDocumentIsReadyForCorrection(OcrExtraction extraction) {
        SubmissionDocument document = extraction.getPage().getDocument();
        if (document.getStatus() != SubmissionDocument.Status.READY) {
            throw new IllegalStateException("Submitted OCR cannot be changed.");
        }
    }

    private void ensureCorrectedTextIsPresent(String correctedText) {
        if (correctedText == null || correctedText.isBlank()) {
            throw new IllegalArgumentException("Corrected text is required.");
        }
    }

    public static class NotFound extends RuntimeException {
    }
}
