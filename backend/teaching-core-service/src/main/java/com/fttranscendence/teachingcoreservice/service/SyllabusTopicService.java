package com.fttranscendence.teachingcoreservice.service;

import com.fttranscendence.teachingcoreservice.dto.SyllabusTopicDTO;
import com.fttranscendence.teachingcoreservice.model.Subject;
import com.fttranscendence.teachingcoreservice.model.SyllabusTopic;
import com.fttranscendence.teachingcoreservice.repository.SyllabusTopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SyllabusTopicService {
    private final SyllabusTopicRepository syllabusTopicRepository;

    @Transactional
    public SyllabusTopicDTO createTopic(SyllabusTopicDTO request) {
        // Check for duplicates
        if (syllabusTopicRepository.existsByTopicAndSubtopicAndSubject(
                request.getTopic(), request.getSubtopic(), request.getSubject())) {
            throw new RuntimeException("Topic already exists");
        }

        SyllabusTopic topic = new SyllabusTopic();
        topic.setLevel(request.getLevel());
        topic.setSubject(request.getSubject());
        topic.setTopic(request.getTopic());
        topic.setSubtopic(request.getSubtopic());
        topic.setDescription(request.getDescription());

        SyllabusTopic saved = syllabusTopicRepository.save(topic);

        return mapToDTO(saved);
    }

    public List<SyllabusTopicDTO> getTopicsBySubjectAndLevel(String subject, Integer level) {
        Subject subjectEnum = Subject.valueOf(subject);
        return syllabusTopicRepository.findBySubjectAndLevel(subjectEnum, level)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public SyllabusTopicDTO getTopicById(Long id) {
        SyllabusTopic topic = syllabusTopicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Topic not found: " + id));
        return mapToDTO(topic);
    }

    public List<SyllabusTopicDTO> searchTopics(String keyword) {
        return syllabusTopicRepository.findByTopicContainingIgnoreCase(keyword)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private SyllabusTopicDTO mapToDTO(SyllabusTopic topic) {
        return SyllabusTopicDTO.builder()
                .id(topic.getId())
                .level(topic.getLevel())
                .subject(topic.getSubject())
                .topic(topic.getTopic())
                .subtopic(topic.getSubtopic())
                .description(topic.getDescription())
                .build();
    }
}