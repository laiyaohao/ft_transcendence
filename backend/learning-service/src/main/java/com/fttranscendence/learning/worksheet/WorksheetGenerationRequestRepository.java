package com.fttranscendence.learning.worksheet;

import org.springframework.data.repository.Repository;
import java.util.Optional;

public interface WorksheetGenerationRequestRepository extends Repository<WorksheetGenerationRequest, Long> {
    <S extends WorksheetGenerationRequest> S save(S request);
    Optional<WorksheetGenerationRequest> findByIdAndTutorId(Long id, Long tutorId);
    Optional<WorksheetGenerationRequest> findByTutorIdAndIdempotencyKey(Long tutorId, String idempotencyKey);
}
