package com.fttranscendence.learning.question;

import com.fttranscendence.learning.syllabus.SyllabusTopic;
import com.fttranscendence.learning.syllabus.SyllabusTopicRepository;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class QuestionService {

    private final QuestionRepository questions;
    private final SyllabusTopicRepository syllabusTopics;
    private final EntityManager entityManager;

    public QuestionService(QuestionRepository questions, SyllabusTopicRepository syllabusTopics, EntityManager entityManager) {
        this.questions = questions;
        this.syllabusTopics = syllabusTopics;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public QuestionPage list(QuestionQuery query) {
        Page<Question> result = questions.findQuestionBank(
            query.topicId(), query.questionType(), query.archiveState(), normalizeSearch(query.search()),
            PageRequest.of(query.page(), query.size())
        );
        return new QuestionPage(
            result.getContent().stream().map(QuestionItem::from).toList(),
            result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public QuestionDetail get(long questionId) {
        return QuestionDetail.from(getQuestion(questionId));
    }

    @Transactional
    public QuestionDetail create(QuestionRequest request) {
        String code = normalizedCode(request.code());
        if (questions.existsByCode(code)) {
            throw new DuplicateQuestionCodeException();
        }

        Question question = new Question();
        apply(question, request, false);
        try {
            Question saved = questions.save(question);
            entityManager.flush();
            return QuestionDetail.from(saved);
        } catch (org.springframework.dao.DataIntegrityViolationException exception) {
            throw new DuplicateQuestionCodeException();
        }
    }

    @Transactional
    public QuestionDetail update(long questionId, QuestionRequest request) {
        Question question = getQuestion(questionId);
        String code = normalizedCode(request.code());
        questions.findByCode(code).filter(found -> !found.getId().equals(question.getId()))
            .ifPresent(found -> { throw new DuplicateQuestionCodeException(); });

        if (questions.isUsedByAnyWorksheet(questionId) && changesContent(question, request)) {
            throw new QuestionInUseException();
        }
        apply(question, request, true);
        try {
            Question saved = questions.save(question);
            entityManager.flush();
            return QuestionDetail.from(saved);
        } catch (org.springframework.dao.DataIntegrityViolationException exception) {
            throw new DuplicateQuestionCodeException();
        }
    }

    private Question getQuestion(long questionId) {
        return questions.findById(questionId).orElseThrow(QuestionNotFoundException::new);
    }

    private void apply(Question question, QuestionRequest request, boolean update) {
        SyllabusTopic topic = syllabusTopics.findById(request.syllabusTopicId())
            .filter(SyllabusTopic::isActive)
            .filter(candidate -> candidate.getNodeType() == SyllabusTopic.NodeType.TOPIC || candidate.getNodeType() == SyllabusTopic.NodeType.SUBTOPIC)
            .orElseThrow(() -> new InvalidQuestionRequestException("syllabusTopicId", "Choose an active syllabus topic or subtopic."));
        validateAggregate(request);

        question.setCode(normalizedCode(request.code()));
        question.setSyllabusTopic(topic);
        question.setQuestionType(request.questionType());
        question.setPrompt(request.prompt().trim());
        question.setTotalMarks(request.totalMarks());
        question.setModelAnswer(request.modelAnswer().trim());
        question.replaceMarkingComponents(request.markingComponents().stream()
            .map(component -> new MarkingComponent(component.description().trim(), component.marks(), normalizedKeywords(component.keywords())))
            .toList());
        question.replaceKeywords(normalizedKeywords(request.keywords()));

        Question.ArchiveState archiveState = request.archiveState();
        if (archiveState == null && update) {
            throw new InvalidQuestionRequestException("archiveState", "Choose whether this question is active or archived.");
        }
        if (archiveState == Question.ArchiveState.ARCHIVED) question.archive();
        else question.restore();
    }

    private void validateAggregate(QuestionRequest request) {
        if (request.totalMarks().scale() > 2) {
            throw new InvalidQuestionRequestException("totalMarks", "Total marks may have at most two decimal places.");
        }
        BigDecimal componentTotal = request.markingComponents().stream()
            .map(QuestionRequest.MarkingComponentRequest::marks)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (request.totalMarks().compareTo(componentTotal) != 0) {
            throw new InvalidQuestionRequestException("markingComponents", "Marking component marks must exactly equal the total marks.");
        }
        for (QuestionRequest.MarkingComponentRequest component : request.markingComponents()) {
            if (component.marks().scale() > 2) {
                throw new InvalidQuestionRequestException("markingComponents", "Component marks may have at most two decimal places.");
            }
            List<String> componentKeywords = normalizedKeywords(component.keywords());
            if (componentKeywords.stream().distinct().count() != componentKeywords.size()) {
                throw new InvalidQuestionRequestException("markingComponents", "Component keywords must be unique.");
            }
        }
        List<String> keywords = normalizedKeywords(request.keywords());
        if (keywords.stream().distinct().count() != keywords.size()) {
            throw new InvalidQuestionRequestException("keywords", "Keywords must be unique.");
        }
    }

    private boolean changesContent(Question question, QuestionRequest request) {
        if (!question.getCode().equals(normalizedCode(request.code()))
            || !question.getSyllabusTopic().getId().equals(request.syllabusTopicId())
            || question.getQuestionType() != request.questionType()
            || !question.getPrompt().equals(request.prompt().trim())
            || question.getTotalMarks().compareTo(request.totalMarks()) != 0
            || !question.getModelAnswer().equals(request.modelAnswer().trim())
            || !componentRequestsEqual(question.getMarkingComponents(), request.markingComponents())) {
            return true;
        }
        return !question.getKeywords().equals(normalizedKeywords(request.keywords()));
    }

    private boolean componentRequestsEqual(List<MarkingComponent> components, List<QuestionRequest.MarkingComponentRequest> requests) {
        if (components.size() != requests.size()) return false;
        for (int index = 0; index < components.size(); index++) {
            MarkingComponent existing = components.get(index);
            QuestionRequest.MarkingComponentRequest requested = requests.get(index);
            if (!existing.getDescription().equals(requested.description().trim())
                || existing.getMarks().compareTo(requested.marks()) != 0
                || !existing.getKeywords().equals(normalizedKeywords(requested.keywords()))) return false;
        }
        return true;
    }

    private String normalizedCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private List<String> normalizedKeywords(List<String> keywords) {
        if (keywords == null) return List.of();
        List<String> normalized = new ArrayList<>(keywords.size());
        for (String keyword : keywords) {
            normalized.add(keyword.trim().toLowerCase(Locale.ROOT));
        }
        return List.copyOf(normalized);
    }

    /**
     * The repository uses ! as the explicit LIKE escape character. Keeping the
     * escaping here makes a search for a code such as SCI_01 or 50% literal,
     * rather than turning user input into a pattern.
     */
    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) return null;
        String normalized = java.text.Normalizer.normalize(search.trim(), java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.ROOT);
        return "%" + normalized.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }

    public record QuestionQuery(
        Long topicId,
        Question.QuestionType questionType,
        Question.ArchiveState archiveState,
        String search,
        int page,
        int size
    ) {}

    public record QuestionPage(
        List<QuestionItem> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
    ) {}

    public record QuestionItem(
        long id,
        String code,
        SyllabusTopicSummary syllabusTopic,
        Question.QuestionType questionType,
        String prompt,
        BigDecimal totalMarks,
        Question.ArchiveState archiveState
    ) {
        static QuestionItem from(Question question) {
            SyllabusTopic topic = question.getSyllabusTopic();
            return new QuestionItem(question.getId(), question.getCode(), new SyllabusTopicSummary(
                topic.getId(), topic.getCode(), topic.getName(), topic.getNodeType()),
                question.getQuestionType(), question.getPrompt(), question.getTotalMarks(), question.getArchiveState());
        }
    }

    public record SyllabusTopicSummary(
        long id,
        String code,
        String name,
        SyllabusTopic.NodeType nodeType
    ) {}

    public record QuestionDetail(
        long id,
        String code,
        SyllabusTopicSummary syllabusTopic,
        Question.QuestionType questionType,
        String prompt,
        BigDecimal totalMarks,
        String modelAnswer,
        Question.ArchiveState archiveState,
        List<MarkingComponentDetail> markingComponents,
        List<String> keywords,
        java.time.LocalDateTime createdAt,
        java.time.LocalDateTime updatedAt
    ) {
        static QuestionDetail from(Question question) {
            SyllabusTopic topic = question.getSyllabusTopic();
            return new QuestionDetail(
                question.getId(), question.getCode(), new SyllabusTopicSummary(topic.getId(), topic.getCode(), topic.getName(), topic.getNodeType()),
                question.getQuestionType(), question.getPrompt(), question.getTotalMarks(), question.getModelAnswer(), question.getArchiveState(),
                question.getMarkingComponents().stream().map(component -> new MarkingComponentDetail(component.getPosition(), component.getDescription(), component.getMarks(), component.getKeywords())).toList(),
                question.getKeywords(), question.getCreatedAt(), question.getUpdatedAt()
            );
        }
    }

    public record MarkingComponentDetail(int position, String description, BigDecimal marks, List<String> keywords) {}

    public static final class QuestionNotFoundException extends RuntimeException {}
    public static final class DuplicateQuestionCodeException extends RuntimeException {}
    public static final class QuestionInUseException extends RuntimeException {}
    public static final class InvalidQuestionRequestException extends RuntimeException {
        private final String field;
        public InvalidQuestionRequestException(String field, String message) {
            super(message);
            this.field = field;
        }
        public String field() { return field; }
    }
}
