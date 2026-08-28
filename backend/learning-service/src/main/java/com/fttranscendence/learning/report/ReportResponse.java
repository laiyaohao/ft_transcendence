package com.fttranscendence.learning.report;

import tools.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read-only representation of a persisted progress-report snapshot.
 *
 * <p>The snapshot is deliberately returned as stored.  Consumers must not
 * combine it with current mastery or insight data: a final report is a record
 * of the evidence available for its reporting period.</p>
 */
public record ReportResponse(
    Long id,
    Long studentId,
    String studentName,
    String reportCode,
    ProgressReport.ReportStatus status,
    LocalDate periodStart,
    LocalDate periodEnd,
    JsonNode snapshot,
    LocalDateTime generatedAt,
    LocalDateTime finalizedAt
) { }
