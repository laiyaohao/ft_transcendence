package com.fttranscendence.learning.question.imports;

import com.fttranscendence.learning.question.Question;
import com.fttranscendence.learning.question.QuestionRepository;
import com.fttranscendence.learning.question.QuestionRequest;
import com.fttranscendence.learning.question.QuestionService;
import com.fttranscendence.learning.syllabus.SyllabusTopic;
import com.fttranscendence.learning.syllabus.SyllabusTopicRepository;
import jakarta.persistence.EntityManager;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.imageio.ImageIO;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class QuestionImportService {
    private static final int MAX_FILES_PER_BATCH = 20;
    private static final int MAX_PAGES_PER_BATCH = 100;
    private static final long MAX_UPLOAD_BYTES = 25L * 1024 * 1024;
    private static final Pattern QUESTION_BOUNDARY = Pattern.compile(
        "(?m)(?=^\\s*(?:question\\s*)?\\d{1,3}[.)])", Pattern.CASE_INSENSITIVE);
    private static final Pattern ANSWER = Pattern.compile(
        "(?im)^\\s*(?:answer|ans|solution)\\s*[:.-]\\s*(.+)$");

    private final QuestionImportBatchRepository batches;
    private final QuestionImportSourcePageRepository pages;
    private final QuestionImportCandidateRepository candidates;
    private final QuestionRepository questions;
    private final QuestionService questionService;
    private final SyllabusTopicRepository syllabusTopics;
    private final EntityManager entityManager;

    public QuestionImportService(QuestionImportBatchRepository batches, QuestionImportSourcePageRepository pages,
                                 QuestionImportCandidateRepository candidates, QuestionRepository questions,
                                 QuestionService questionService, SyllabusTopicRepository syllabusTopics,
                                 EntityManager entityManager) {
        this.batches = batches; this.pages = pages; this.candidates = candidates; this.questions = questions;
        this.questionService = questionService; this.syllabusTopics = syllabusTopics; this.entityManager = entityManager;
    }

    @Transactional
    public BatchDetail upload(List<MultipartFile> uploadedFiles) {
        if (uploadedFiles == null || uploadedFiles.isEmpty() || uploadedFiles.size() > MAX_FILES_PER_BATCH) {
            throw new InvalidImportException("Upload from 1 to 20 PDF, PNG, or JPEG files.");
        }
        QuestionImportBatch batch = batches.save(new QuestionImportBatch("Question import", QuestionImportBatch.Status.READY_FOR_REVIEW));
        int importedPages = 0;
        for (MultipartFile file : uploadedFiles) {
            validateUpload(file);
            String filename = safeFilename(file.getOriginalFilename());
            byte[] bytes = readBytes(file);
            if (isPdf(bytes, file.getContentType(), filename)) {
                importedPages += addPdfPages(batch, filename, bytes, MAX_PAGES_PER_BATCH - importedPages);
            } else {
                addImagePage(batch, filename, bytes);
                importedPages++;
            }
            if (importedPages > MAX_PAGES_PER_BATCH) throw new InvalidImportException("A batch can contain at most 100 pages.");
        }
        entityManager.flush();
        return get(batch.getId());
    }

    @Transactional(readOnly = true)
    public BatchDetail get(long batchId) {
        QuestionImportBatch batch = batches.findById(batchId).orElseThrow(BatchNotFoundException::new);
        return BatchDetail.from(batch, candidates.findAllForBatch(batchId));
    }

    @Transactional(readOnly = true)
    public ImageContent sourcePageImage(long batchId, long pageId) {
        QuestionImportSourcePage page = pages.findByIdAndBatch_Id(pageId, batchId)
            .orElseThrow(SourcePageNotFoundException::new);
        return new ImageContent(page.getContentType(), page.getPageImageBytes());
    }

    @Transactional
    public CandidateDetail update(long batchId, long candidateId, QuestionImportRequests.CandidateUpdate update) {
        QuestionImportCandidate candidate = candidate(batchId, candidateId);
        if (candidate.getStatus() == QuestionImportCandidate.Status.IMPORTED) {
            throw new InvalidImportException("An imported draft can no longer be edited here.");
        }
        SyllabusTopic topic = update.syllabusTopicId() == null ? null : syllabusTopics.findById(update.syllabusTopicId())
            .orElseThrow(() -> new InvalidImportException("Choose an existing syllabus topic."));
        candidate.revise(trimOrNull(update.code()), topic, defaultString(update.prompt()), defaultString(update.modelAnswer()),
            update.totalMarks() == null ? BigDecimal.ONE : update.totalMarks(),
            update.questionType() == null ? candidate.getSuggestedQuestionType() : update.questionType(),
            update.difficulty() == null ? candidate.getSuggestedDifficulty() : update.difficulty(), update.includeSourceImage());
        return CandidateDetail.from(candidates.save(candidate));
    }

    @Transactional
    public ImportResult importCandidates(long batchId, QuestionImportRequests.ImportCandidates request) {
        QuestionImportBatch batch = batches.findById(batchId).orElseThrow(BatchNotFoundException::new);
        List<Long> uniqueIds = request.candidateIds().stream().distinct().toList();
        if (uniqueIds.size() != request.candidateIds().size()) throw new InvalidImportException("Choose each draft only once.");
        List<Long> importedQuestionIds = new ArrayList<>();
        for (Long candidateId : uniqueIds) {
            QuestionImportCandidate candidate = candidate(batchId, candidateId);
            if (candidate.getStatus() == QuestionImportCandidate.Status.IMPORTED) {
                throw new InvalidImportException("A selected draft was already imported.");
            }
            if (candidate.getStatus() == QuestionImportCandidate.Status.FAILED) {
                throw new InvalidImportException("Correct or remove failed OCR drafts before importing.");
            }
            validateReadyForImport(candidate);
            String code = candidate.getQuestionCode() == null ? generatedCode(batchId, candidate) : candidate.getQuestionCode();
            QuestionRequest questionRequest = new QuestionRequest(code, candidate.getSyllabusTopic().getId(),
                candidate.getSuggestedQuestionType(), candidate.getSuggestedDifficulty(), candidate.getPrompt(),
                candidate.getTotalMarks(), candidate.getModelAnswer(), Question.ArchiveState.ARCHIVED,
                List.of(new QuestionRequest.MarkingComponentRequest("Imported answer evidence", candidate.getTotalMarks(),
                    answerKeywords(candidate.getModelAnswer()))), answerKeywords(candidate.getModelAnswer()));
            long questionId = questionService.create(questionRequest).id();
            Question importedQuestion = questions.findById(questionId).orElseThrow();
            if (candidate.isIncludeSourceImage()) attachSourcePage(importedQuestion, candidate.getSourcePage());
            candidate.imported(importedQuestion);
            importedQuestionIds.add(questionId);
        }
        boolean allCandidatesResolved = candidates.findAllForBatch(batchId).stream()
            .allMatch(candidate -> candidate.getStatus() == QuestionImportCandidate.Status.IMPORTED
                || candidate.getStatus() == QuestionImportCandidate.Status.FAILED);
        if (allCandidatesResolved) {
            batch.setStatus(QuestionImportBatch.Status.IMPORTED);
        }
        return new ImportResult(importedQuestionIds, "Imported questions are archived pending review. Activate each one after final review.");
    }

    private int addPdfPages(QuestionImportBatch batch, String filename, byte[] bytes, int remainingPageCapacity) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.getNumberOfPages() > remainingPageCapacity) throw new InvalidImportException("A batch can contain at most 100 pages.");
            PDFRenderer renderer = new PDFRenderer(document);
            PDFTextStripper stripper = new PDFTextStripper();
            for (int index = 0; index < document.getNumberOfPages(); index++) {
                stripper.setStartPage(index + 1); stripper.setEndPage(index + 1);
                BufferedImage rendered = renderer.renderImageWithDPI(index, 144, ImageType.RGB);
                byte[] pageBytes = encodeJpeg(rendered);
                String extractedText = limitText(stripper.getText(document));
                QuestionImportSourcePage page = pages.save(new QuestionImportSourcePage(batch, filename, index + 1,
                    "image/jpeg", pageBytes, rendered.getWidth(), rendered.getHeight(), extractedText, null));
                detectCandidates(batch, page, extractedText);
            }
            return document.getNumberOfPages();
        } catch (IOException exception) {
            throw new InvalidImportException("The PDF could not be processed. Upload a valid, unencrypted PDF.");
        }
    }

    private void addImagePage(QuestionImportBatch batch, String filename, byte[] bytes) {
        String contentType = imageContentType(bytes);
        BufferedImage decoded = decodeImage(bytes);
        QuestionImportSourcePage page = pages.save(new QuestionImportSourcePage(batch, filename, 1, contentType, bytes,
            decoded.getWidth(), decoded.getHeight(), "", null));
        candidates.save(new QuestionImportCandidate(batch, page, 1, QuestionImportCandidate.Status.UNCERTAIN, 0,
            "No local OCR engine is configured for image-only uploads. Transcribe and review this source image before importing.",
            Question.QuestionType.OPEN_ENDED, Question.Difficulty.FOUNDATION, "image-import", "", ""));
    }

    private void detectCandidates(QuestionImportBatch batch, QuestionImportSourcePage page, String text) {
        List<String> segments = splitQuestions(text);
        if (segments.isEmpty()) {
            candidates.save(new QuestionImportCandidate(batch, page, 1, QuestionImportCandidate.Status.UNCERTAIN, 20,
                "No numbered questions were detected. Check the page image and enter the question manually.",
                Question.QuestionType.OPEN_ENDED, Question.Difficulty.FOUNDATION, "needs-review", text, extractAnswer(text)));
            return;
        }
        for (int index = 0; index < segments.size(); index++) {
            String segment = segments.get(index);
            boolean hasAnswer = !extractAnswer(segment).isBlank();
            candidates.save(new QuestionImportCandidate(batch, page, index + 1,
                hasAnswer ? QuestionImportCandidate.Status.READY_FOR_REVIEW : QuestionImportCandidate.Status.UNCERTAIN,
                hasAnswer ? 82 : 58, hasAnswer ? null : "No answer or solution was detected; add one before importing.",
                inferQuestionType(segment), inferDifficulty(segment), inferTags(segment), segment, extractAnswer(segment)));
        }
    }

    private QuestionImportCandidate candidate(long batchId, long candidateId) {
        return candidates.findByIdAndBatch_Id(candidateId, batchId).orElseThrow(CandidateNotFoundException::new);
    }
    private void validateReadyForImport(QuestionImportCandidate candidate) {
        if (candidate.getSyllabusTopic() == null || candidate.getPrompt().isBlank() || candidate.getModelAnswer().isBlank()) {
            throw new InvalidImportException("Each draft needs a syllabus topic, question text, and model answer before import.");
        }
    }
    private void attachSourcePage(Question question, QuestionImportSourcePage sourcePage) {
        if (question.getImages().size() >= 10) return;
        question.addImage(sourcePage.getSourceFilename() + " page " + sourcePage.getSourcePageNumber(),
            sourcePage.getContentType(), sourcePage.getPageImageBytes(), sourcePage.getWidth(), sourcePage.getHeight());
        questions.save(question);
    }
    private List<String> splitQuestions(String text) {
        if (text == null || text.isBlank()) return List.of();
        String[] split = QUESTION_BOUNDARY.split(text.trim());
        return Arrays.stream(split).map(String::trim).filter(value -> value.length() >= 4).limit(50).toList();
    }
    private String extractAnswer(String text) { Matcher matcher = ANSWER.matcher(text); return matcher.find() ? matcher.group(1).trim() : ""; }
    private Question.QuestionType inferQuestionType(String text) { String lower = text.toLowerCase(Locale.ROOT); return lower.contains("calculate") || lower.contains("cm") || lower.contains("kg") ? Question.QuestionType.CALCULATION : lower.contains("diagram") || lower.contains("label") ? Question.QuestionType.DIAGRAM : Question.QuestionType.OPEN_ENDED; }
    private Question.Difficulty inferDifficulty(String text) { return text.toLowerCase(Locale.ROOT).contains("explain") ? Question.Difficulty.APPLICATION : Question.Difficulty.FOUNDATION; }
    private String inferTags(String text) { String lower = text.toLowerCase(Locale.ROOT); List<String> tags = new ArrayList<>(); for (String tag : List.of("diagram", "calculation", "explain", "experiment", "plant", "water")) if (lower.contains(tag)) tags.add(tag); return String.join(", ", tags); }
    private List<String> answerKeywords(String answer) { return Arrays.stream(answer.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+")) .filter(word -> word.length() >= 3).distinct().limit(20).toList(); }
    private void validateUpload(MultipartFile file) { if (file == null || file.isEmpty() || file.getSize() > MAX_UPLOAD_BYTES) throw new InvalidImportException("Each upload must be a PDF, PNG, or JPEG no larger than 25 MB."); }
    private byte[] readBytes(MultipartFile file) { try { return file.getBytes(); } catch (IOException exception) { throw new InvalidImportException("An uploaded file could not be read."); } }
    private boolean isPdf(byte[] bytes, String contentType, String filename) { return (contentType != null && contentType.equalsIgnoreCase("application/pdf")) || filename.toLowerCase(Locale.ROOT).endsWith(".pdf") || bytes.length >= 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F'; }
    private String imageContentType(byte[] bytes) { if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47) return "image/png"; if (bytes.length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff) return "image/jpeg"; throw new InvalidImportException("Only PDF, PNG, and JPEG files are supported."); }
    private BufferedImage decodeImage(byte[] bytes) { try { BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes)); if (image == null || image.getWidth() < 1 || image.getHeight() < 1) throw new IOException(); return image; } catch (IOException exception) { throw new InvalidImportException("The uploaded image is invalid."); } }
    private byte[] encodeJpeg(BufferedImage image) throws IOException { ByteArrayOutputStream output = new ByteArrayOutputStream(); if (!ImageIO.write(image, "jpeg", output)) throw new IOException(); return output.toByteArray(); }
    private String safeFilename(String name) { String value = name == null ? "source" : name.replaceAll("[\\r\\n\\\\/]", "_").trim(); return value.isBlank() ? "source" : value.substring(0, Math.min(value.length(), 255)); }
    private String limitText(String value) { return value == null ? "" : value.trim().substring(0, Math.min(value.trim().length(), 12000)); }
    private String generatedCode(long batchId, QuestionImportCandidate candidate) { return "IMPORT-" + batchId + "-" + candidate.getId(); }
    private String defaultString(String value) { return value == null ? "" : value.trim(); }
    private String trimOrNull(String value) { String result = defaultString(value); return result.isBlank() ? null : result.toUpperCase(Locale.ROOT); }

    public record ImageContent(String contentType, byte[] bytes) { }
    public record SourceReference(long pageId, String filename, int pageNumber) { }
    public record CandidateDetail(long id, int number, String status, int confidence, String warningMessage,
                                  String code, Long syllabusTopicId, String prompt, String modelAnswer, BigDecimal totalMarks,
                                  Question.QuestionType questionType, Question.Difficulty difficulty, String suggestedTags,
                                  boolean includeSourceImage, SourceReference source) {
        static CandidateDetail from(QuestionImportCandidate candidate) { return new CandidateDetail(candidate.getId(), candidate.getCandidateNumber(), candidate.getStatus().name(), candidate.getConfidence(), candidate.getWarningMessage(), candidate.getQuestionCode(), candidate.getSyllabusTopic() == null ? null : candidate.getSyllabusTopic().getId(), candidate.getPrompt(), candidate.getModelAnswer(), candidate.getTotalMarks(), candidate.getSuggestedQuestionType(), candidate.getSuggestedDifficulty(), candidate.getSuggestedTags(), candidate.isIncludeSourceImage(), new SourceReference(candidate.getSourcePage().getId(), candidate.getSourcePage().getSourceFilename(), candidate.getSourcePage().getSourcePageNumber())); }
    }
    public record BatchDetail(long id, String status, String originalFilename, List<CandidateDetail> candidates) {
        static BatchDetail from(QuestionImportBatch batch, List<QuestionImportCandidate> candidates) { return new BatchDetail(batch.getId(), batch.getStatus().name(), batch.getOriginalFilename(), candidates.stream().map(CandidateDetail::from).toList()); }
    }
    public record ImportResult(List<Long> questionIds, String message) { }
    public static final class BatchNotFoundException extends RuntimeException { }
    public static final class CandidateNotFoundException extends RuntimeException { }
    public static final class SourcePageNotFoundException extends RuntimeException { }
    public static final class InvalidImportException extends RuntimeException { public InvalidImportException(String message) { super(message); } }
}
