package com.fttranscendence.teachingcoreservice.controller;

import com.fttranscendence.teachingcoreservice.dto.AddStudentToClassRequest;
import com.fttranscendence.teachingcoreservice.dto.ClassDTO;
import com.fttranscendence.teachingcoreservice.dto.CreateClassRequest;
import com.fttranscendence.teachingcoreservice.service.ClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {
    private final ClassService classService;

    @PostMapping
    public ResponseEntity<ClassDTO> createClass(@Valid @RequestBody CreateClassRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classService.createClass(request));
    }

    @PostMapping("/{classId}/students")
    public ResponseEntity<Void> addStudentToClass(
            @PathVariable Long classId,
            @Valid @RequestBody AddStudentToClassRequest request) {
        classService.addStudentToClass(classId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{classId}/students/{studentId}")
    public ResponseEntity<Void> removeStudentFromClass(
            @PathVariable Long classId,
            @PathVariable Long studentId) {
        classService.removeStudentFromClass(classId, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassDTO> getClassById(@PathVariable Long id) {
        return ResponseEntity.ok(classService.getClassById(id));
    }

    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<ClassDTO>> getClassesByTutorId(@PathVariable Long tutorId) {
        return ResponseEntity.ok(classService.getClassesByTutorId(tutorId));
    }
}