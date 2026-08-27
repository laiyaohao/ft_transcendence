package com.fttranscendence.teachingcoreservice.controller;

import com.fttranscendence.teachingcoreservice.dto.SyllabusTopicDTO;
import com.fttranscendence.teachingcoreservice.service.SyllabusTopicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/syllabus")
@RequiredArgsConstructor
public class SyllabusTopicController {
    private final SyllabusTopicService syllabusTopicService;

    @PostMapping("/topics")
    public ResponseEntity<SyllabusTopicDTO> createTopic(@Valid @RequestBody SyllabusTopicDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(syllabusTopicService.createTopic(request));
    }

    @GetMapping("/topics/subject/{subject}/level/{level}")
    public ResponseEntity<List<SyllabusTopicDTO>> getTopicsBySubjectAndLevel(
            @PathVariable String subject,
            @PathVariable Integer level) {
        return ResponseEntity.ok(syllabusTopicService.getTopicsBySubjectAndLevel(subject, level));
    }

    @GetMapping("/topics/{id}")
    public ResponseEntity<SyllabusTopicDTO> getTopicById(@PathVariable Long id) {
        return ResponseEntity.ok(syllabusTopicService.getTopicById(id));
    }

    @GetMapping("/topics/search")
    public ResponseEntity<List<SyllabusTopicDTO>> searchTopics(@RequestParam String keyword) {
        return ResponseEntity.ok(syllabusTopicService.searchTopics(keyword));
    }
}