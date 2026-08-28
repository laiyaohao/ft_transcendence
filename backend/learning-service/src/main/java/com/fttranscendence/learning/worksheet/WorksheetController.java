package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.classroom.ClassController;
import com.fttranscendence.learning.pdf.PdfDocumentService;
import com.fttranscendence.learning.security.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.dao.DataAccessException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping(value = "/api/learning", produces = MediaType.APPLICATION_JSON_VALUE)
public class WorksheetController {
    private final WorksheetService worksheets;
    private final DiagnosticWorksheetService diagnostics;
    private final WorksheetPdfService worksheetPdfs;

    public WorksheetController(WorksheetService worksheets, DiagnosticWorksheetService diagnostics, WorksheetPdfService worksheetPdfs) {
        this.worksheets = worksheets; this.diagnostics = diagnostics; this.worksheetPdfs = worksheetPdfs;
    }

    @PostMapping(value = "/tutor/classes/{classId}/worksheet-generation-requests", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<WorksheetRequests.GenerationRequestResponse> generate(
            @AuthenticationPrincipal AuthenticatedUser user, @PathVariable @Positive long classId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody WorksheetRequests.GenerateWorksheetRequest request) {
        WorksheetRequests.GenerationRequestResponse response = worksheets.generate(user.userId(), classId, idempotencyKey, request);
        return ResponseEntity.status(response.status() == WorksheetGenerationRequest.Status.SUCCEEDED ? HttpStatus.CREATED : HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/tutor/classes/{classId}/worksheet-generation-requests/{requestId}")
    public WorksheetRequests.GenerationRequestResponse generationRequest(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive long classId, @PathVariable @Positive long requestId) {
        return worksheets.getGenerationRequest(user.userId(), classId, requestId);
    }

    @GetMapping("/tutor/worksheets/{worksheetId}")
    public WorksheetRequests.WorksheetResponse worksheet(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive long worksheetId) { return worksheets.getWorksheet(user.userId(), worksheetId); }

    @GetMapping("/tutor/worksheets")
    public java.util.List<WorksheetRequests.WorksheetResponse> worksheets(@AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) @Positive Long classId) {
        return worksheets.listWorksheets(user.userId(), classId);
    }

    @GetMapping(value = "/tutor/worksheets/{worksheetId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> worksheetPdf(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive long worksheetId) {
        WorksheetPdfService.PdfExport export = worksheetPdfs.export(user.userId(), worksheetId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename(export.filename(), StandardCharsets.UTF_8).build().toString())
            .body(export.bytes());
    }

    @PatchMapping(value = "/tutor/worksheets/{worksheetId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public WorksheetRequests.WorksheetResponse updateWorksheet(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive long worksheetId, @Valid @RequestBody WorksheetRequests.UpdateWorksheetRequest request) {
        return worksheets.updateWorksheet(user.userId(), worksheetId, request);
    }

    @PostMapping(value = "/tutor/worksheets/{worksheetId}/approve", consumes = MediaType.APPLICATION_JSON_VALUE)
    public WorksheetRequests.WorksheetResponse approve(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive long worksheetId, @Valid @RequestBody WorksheetRequests.ApproveWorksheetRequest request) {
        return worksheets.approveAndAssign(user.userId(), worksheetId, request);
    }

    @GetMapping("/tutor/classes/{classId}/worksheet-recommendations")
    public DiagnosticWorksheetService.Recommendations recommendations(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable @Positive long classId) { return diagnostics.recommendations(user.userId(), classId); }

    /** No student selector: the server derives the linked learner from the authenticated JWT. */
    @GetMapping("/student/worksheets")
    public java.util.List<WorksheetRequests.StudentWorksheetLibraryItem> studentWorksheets(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate assignedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate assignedTo) {
        WorksheetRequests.StudentWorksheetStatus normalizedStatus = null;
        if (status != null && !status.isBlank()) {
            try { normalizedStatus = WorksheetRequests.StudentWorksheetStatus.valueOf(status.trim().toUpperCase(java.util.Locale.ROOT)); }
            catch (IllegalArgumentException exception) { throw new WorksheetService.InvalidStudentWorksheetFilterException("status must be ASSIGNED, SUBMITTED or MARKED."); }
        }
        return worksheets.listStudentWorksheets(user.userId(), new WorksheetService.StudentWorksheetFilter(subjectId, topicId, normalizedStatus, assignedFrom, assignedTo));
    }

    @ExceptionHandler({WorksheetService.ClassNotFoundException.class, WorksheetService.WorksheetNotFoundException.class,
        WorksheetService.GenerationRequestNotFoundException.class, WorksheetService.StudentWorksheetNotFoundException.class})
    ResponseEntity<ClassController.ApiError> notFound(RuntimeException exception) { return error(HttpStatus.NOT_FOUND, "WORKSHEET_RESOURCE_NOT_FOUND", "Worksheet resource was not found."); }
    @ExceptionHandler(WorksheetService.IdempotencyConflictException.class)
    ResponseEntity<ClassController.ApiError> conflict(WorksheetService.IdempotencyConflictException exception) { return error(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED", "This idempotency key was already used for a different request."); }
    @ExceptionHandler({WorksheetService.WorksheetNotDraftException.class, WorksheetService.WorksheetNotGeneratedException.class})
    ResponseEntity<ClassController.ApiError> invalidState(RuntimeException exception) { return error(HttpStatus.CONFLICT, "WORKSHEET_STATE_CONFLICT", "This worksheet cannot be changed in its current state."); }
    @ExceptionHandler(WorksheetPdfService.WorksheetNotApprovedException.class)
    ResponseEntity<ClassController.ApiError> pdfUnavailable(WorksheetPdfService.WorksheetNotApprovedException exception) { return error(HttpStatus.CONFLICT, "WORKSHEET_NOT_APPROVED", "Only approved worksheets can be exported as PDFs."); }
    @ExceptionHandler(PdfDocumentService.PdfGenerationException.class)
    ResponseEntity<ClassController.ApiError> pdfFailure(PdfDocumentService.PdfGenerationException exception) { return error(HttpStatus.SERVICE_UNAVAILABLE, "WORKSHEET_PDF_UNAVAILABLE", "Worksheet PDF generation is temporarily unavailable."); }
    @ExceptionHandler(WorksheetService.InvalidWorksheetRequestException.class)
    ResponseEntity<ClassController.ApiError> invalid(WorksheetService.InvalidWorksheetRequestException exception) { return error(HttpStatus.BAD_REQUEST, "INVALID_WORKSHEET_REQUEST", exception.getMessage()); }
    @ExceptionHandler(WorksheetService.InvalidStudentWorksheetFilterException.class)
    ResponseEntity<ClassController.ApiError> invalidLibraryFilter(WorksheetService.InvalidStudentWorksheetFilterException exception) { return error(HttpStatus.BAD_REQUEST, "INVALID_STUDENT_WORKSHEET_FILTER", exception.getMessage()); }
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ClassController.ApiError> malformedLibraryFilter(MethodArgumentTypeMismatchException exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_STUDENT_WORKSHEET_FILTER", "Worksheet library filters are invalid.");
    }
    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ClassController.ApiError> databaseUnavailable(DataAccessException exception) { return error(HttpStatus.SERVICE_UNAVAILABLE, "WORKSHEET_DATA_UNAVAILABLE", "Worksheet data is temporarily unavailable."); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ClassController.ApiError> validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError field : exception.getBindingResult().getFieldErrors()) fields.putIfAbsent(field.getField(), field.getDefaultMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ClassController.ApiError("VALIDATION_FAILED", "Worksheet request is invalid.", fields));
    }
    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ClassController.ApiError> methodValidation(HandlerMethodValidationException exception) { return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Worksheet path values are invalid."); }
    private ResponseEntity<ClassController.ApiError> error(HttpStatus status, String code, String message) { return ResponseEntity.status(status).body(new ClassController.ApiError(code, message, Map.of())); }
}
