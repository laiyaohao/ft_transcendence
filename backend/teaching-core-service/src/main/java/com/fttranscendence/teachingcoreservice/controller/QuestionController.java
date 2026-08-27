package com.fttranscendence.teachingcoreservice.controller;

import com.fttranscendence.teachingcoreservice.dto.QuestionDTO;
import com.fttranscendence.teachingcoreservice.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {
    private final QuestionService questionService;

    @PostMapping
    public ResponseEntity<QuestionDTO> createQuestion(@Valid @RequestBody QuestionDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionDTO> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    @GetMapping("/topic/{topicId}")
    public ResponseEntity<List<QuestionDTO>> getQuestionsByTopic(@PathVariable Long topicId) {
        return ResponseEntity.ok(questionService.getQuestionsByTopic(topicId));
    }

    @GetMapping("/tag/{tagName}")
    public ResponseEntity<List<QuestionDTO>> getQuestionsByTag(@PathVariable String tagName) {
        return ResponseEntity.ok(questionService.getQuestionsByTag(tagName));
    }

    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<List<QuestionDTO>> getQuestionsByDifficulty(@PathVariable String difficulty) {
        return ResponseEntity.ok(questionService.getQuestionsByDifficulty(difficulty));
    }
}