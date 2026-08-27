package com.fttranscendence.teachingcoreservice.service;

import com.fttranscendence.teachingcoreservice.dto.QuestionDTO;
import com.fttranscendence.teachingcoreservice.dto.QuestionTagDTO;
import com.fttranscendence.teachingcoreservice.model.Question;
import com.fttranscendence.teachingcoreservice.model.QuestionTag;
import com.fttranscendence.teachingcoreservice.model.SyllabusTopic;
import com.fttranscendence.teachingcoreservice.model.TagType;
import com.fttranscendence.teachingcoreservice.repository.QuestionRepository;
import com.fttranscendence.teachingcoreservice.repository.QuestionTagRepository;
import com.fttranscendence.teachingcoreservice.repository.SyllabusTopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final SyllabusTopicRepository syllabusTopicRepository;
    private final QuestionTagRepository questionTagRepository;

    @Transactional
    public QuestionDTO createQuestion(QuestionDTO request) {
        // 1. Validate topic exists
        SyllabusTopic topic = syllabusTopicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new RuntimeException("Topic not found: " + request.getTopicId()));

        // 2. Create question
        Question question = new Question();
        question.setTopic(topic);
        question.setQuestionText(request.getQuestionText());
        question.setModelAnswer(request.getModelAnswer());
        question.setSolutionSteps(request.getSolutionSteps());
        question.setDifficulty(request.getDifficulty());
        question.setQuestionType(request.getQuestionType());
        question.setSourceFileId(request.getSourceFileId());

        Question saved = questionRepository.save(question);

        // 3. Add tags if provided
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            for (QuestionTagDTO tagDTO : request.getTags()) {
                QuestionTag tag = new QuestionTag();
                tag.setQuestion(saved);
                tag.setTagName(tagDTO.getTagName());
                tag.setTagType(tagDTO.getTagType());
                questionTagRepository.save(tag);
            }
        }

        return mapToDTO(saved);
    }

    public QuestionDTO getQuestionById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found: " + id));
        return mapToDTO(question);
    }

    public List<QuestionDTO> getQuestionsByTopic(Long topicId) {
        SyllabusTopic topic = syllabusTopicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found: " + topicId));
        
        return questionRepository.findByTopic(topic)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<QuestionDTO> getQuestionsByTag(String tagName) {
        return questionRepository.findByTagName(tagName)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<QuestionDTO> getQuestionsByDifficulty(String difficulty) {
        return questionRepository.findByDifficulty(difficulty)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private QuestionDTO mapToDTO(Question question) {
        List<QuestionTagDTO> tagDTOs = question.getTags().stream()
                .map(tag -> QuestionTagDTO.builder()
                        .id(tag.getId())
                        .tagName(tag.getTagName())
                        .tagType(tag.getTagType())
                        .build())
                .collect(Collectors.toList());

        return QuestionDTO.builder()
                .id(question.getId())
                .topicId(question.getTopic().getId())
                .questionText(question.getQuestionText())
                .modelAnswer(question.getModelAnswer())
                .solutionSteps(question.getSolutionSteps())
                .difficulty(question.getDifficulty())
                .questionType(question.getQuestionType())
                .sourceFileId(question.getSourceFileId())
                .tags(tagDTOs)
                .build();
    }
}