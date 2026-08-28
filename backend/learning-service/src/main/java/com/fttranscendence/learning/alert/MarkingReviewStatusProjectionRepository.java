package com.fttranscendence.learning.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface MarkingReviewStatusProjectionRepository extends JpaRepository<MarkingReviewStatusProjection, Long> {
    List<MarkingReviewStatusProjection> findByTutorIdAndStateAndRequestedAtLessThanEqualOrderByRequestedAtAsc(Long tutorId, MarkingReviewStatusProjection.State state, LocalDateTime requestedAt);
}
