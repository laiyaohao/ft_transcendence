package com.fttranscendence.learning.classroom;

import com.fttranscendence.learning.security.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/learning/tutor/classes", produces = MediaType.APPLICATION_JSON_VALUE)
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    @GetMapping
    public List<ClassRequest.ClassResponse> list(
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return classService.listOwnedClasses(user.userId());
    }

    @GetMapping("/{classId}")
    public ClassDetailResponse detail(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable @Positive long classId
    ) {
        return classService.getOwnedClassDetail(user.userId(), classId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ClassRequest.ClassResponse> create(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody ClassRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(classService.create(user.userId(), request));
    }

    @PutMapping(value = "/{classId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ClassRequest.ClassResponse update(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable @Positive long classId,
        @Valid @RequestBody ClassRequest request
    ) {
        return classService.update(user.userId(), classId, request);
    }

    @ExceptionHandler(ClassService.ClassNotFoundException.class)
    ResponseEntity<ApiError> notFound(ClassService.ClassNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "CLASS_NOT_FOUND", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(ClassService.DuplicateClassException.class)
    ResponseEntity<ApiError> duplicate(ClassService.DuplicateClassException exception) {
        return error(HttpStatus.CONFLICT, "CLASS_ALREADY_EXISTS", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(ClassService.InvalidClassRequestException.class)
    ResponseEntity<ApiError> invalid(ClassService.InvalidClassRequestException exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_CLASS_REQUEST", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Class request is invalid", fields);
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ApiError> persistence(DataAccessException exception) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "CLASS_DATABASE_UNAVAILABLE",
            "Class data is temporarily unavailable", Map.of());
    }

    @ExceptionHandler(ClassService.ClassPersistenceException.class)
    ResponseEntity<ApiError> persistence(ClassService.ClassPersistenceException exception) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "CLASS_DATABASE_UNAVAILABLE",
            "Class data is temporarily unavailable", Map.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> malformed(HttpMessageNotReadableException exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_CLASS_REQUEST",
            "Class request contains invalid JSON or enum/time values", Map.of());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ApiError> methodValidation(HandlerMethodValidationException exception) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
            "Class request is invalid", Map.of("classId", "must be greater than 0"));
    }

    public record ApiError(String code, String message, Map<String, String> fields) {
    }

    private ResponseEntity<ApiError> error(
        HttpStatus status,
        String code,
        String message,
        Map<String, String> fields
    ) {
        return ResponseEntity.status(status).body(new ApiError(code, message, fields));
    }
}
