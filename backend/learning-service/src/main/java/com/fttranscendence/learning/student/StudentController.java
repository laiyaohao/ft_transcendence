package com.fttranscendence.learning.student;

import com.fttranscendence.learning.classroom.ClassController;
import com.fttranscendence.learning.security.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/api/learning/tutor/students")
    public List<StudentRequest.StudentResponse> list(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) @Positive Long classId
    ) {
        return studentService.listOwnedStudents(user.userId(), classId);
    }

    @GetMapping("/api/learning/tutor/students/{studentId}")
    public StudentRequest.StudentResponse detail(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable @Positive long studentId
    ) {
        return studentService.getOwnedStudent(user.userId(), studentId);
    }

    @PostMapping(value = "/api/learning/tutor/students", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StudentRequest.StudentResponse> create(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody StudentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.create(user.userId(), request));
    }

    @PutMapping(value = "/api/learning/tutor/students/{studentId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public StudentRequest.StudentResponse update(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable @Positive long studentId,
        @Valid @RequestBody StudentRequest request
    ) {
        return studentService.update(user.userId(), studentId, request);
    }

    @GetMapping("/api/learning/tutor/students/{studentId}/profile")
    public StudentProfileResponse tutorProfile(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable @Positive long studentId
    ) {
        return studentService.getOwnedStudentProfile(user.userId(), studentId);
    }

    @GetMapping("/api/learning/student/profile")
    public StudentProfileResponse studentProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return studentService.getLinkedStudentProfile(user.userId());
    }

    @ExceptionHandler(StudentService.StudentNotFoundException.class)
    ResponseEntity<ClassController.ApiError> studentNotFound(StudentService.StudentNotFoundException error) {
        return error(HttpStatus.NOT_FOUND, "STUDENT_NOT_FOUND", error.getMessage(), Map.of());
    }

    @ExceptionHandler(StudentService.ProfileNotFoundException.class)
    ResponseEntity<ClassController.ApiError> profileNotFound(StudentService.ProfileNotFoundException error) {
        return error(HttpStatus.NOT_FOUND, "STUDENT_PROFILE_NOT_FOUND", "Student profile was not found", Map.of());
    }

    @ExceptionHandler(StudentService.ClassNotFoundException.class)
    ResponseEntity<ClassController.ApiError> classNotFound(StudentService.ClassNotFoundException error) {
        return error(HttpStatus.NOT_FOUND, "CLASS_NOT_FOUND", error.getMessage(), Map.of());
    }

    @ExceptionHandler(StudentService.DuplicateMembershipException.class)
    ResponseEntity<ClassController.ApiError> duplicateMembership(StudentService.DuplicateMembershipException error) {
        return error(HttpStatus.CONFLICT, "DUPLICATE_MEMBERSHIP", error.getMessage(), Map.of());
    }

    @ExceptionHandler(StudentService.LoginIdentityConflictException.class)
    ResponseEntity<ClassController.ApiError> loginIdentityConflict(StudentService.LoginIdentityConflictException error) {
        return error(HttpStatus.CONFLICT, "LOGIN_IDENTITY_CONFLICT", error.getMessage(), Map.of());
    }

    @ExceptionHandler(StudentService.InvalidStudentRequestException.class)
    ResponseEntity<ClassController.ApiError> invalid(StudentService.InvalidStudentRequestException error) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_STUDENT_REQUEST", error.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ClassController.ApiError> validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Student request is invalid", fields);
    }

    @ExceptionHandler({DataAccessException.class, StudentService.StudentPersistenceException.class})
    ResponseEntity<ClassController.ApiError> persistence(Exception error) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "STUDENT_DATABASE_UNAVAILABLE",
            "Student data is temporarily unavailable", Map.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ClassController.ApiError> malformed(HttpMessageNotReadableException error) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_STUDENT_REQUEST",
            "Student request contains invalid JSON or values", Map.of());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ClassController.ApiError> methodValidation(HandlerMethodValidationException error) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Student request is invalid", Map.of());
    }

    private ResponseEntity<ClassController.ApiError> error(
        HttpStatus status,
        String code,
        String message,
        Map<String, String> fields
    ) {
        return ResponseEntity.status(status).body(new ClassController.ApiError(code, message, fields));
    }
}
