package com.fttranscendence.learning.report;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface ProgressReportRepository extends Repository<ProgressReport, Long> {

    <S extends ProgressReport> S save(S report);

    Optional<ProgressReport> findByIdAndTutorId(Long id, Long tutorId);

    List<ProgressReport> findAllByStudentProfileIdOrderByPeriodEndDesc(Long studentProfileId);

    long countByTutorIdAndReportStatus(Long tutorId, ProgressReport.ReportStatus reportStatus);
}
