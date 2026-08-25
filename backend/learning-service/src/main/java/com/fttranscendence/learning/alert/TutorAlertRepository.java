package com.fttranscendence.learning.alert;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface TutorAlertRepository extends Repository<TutorAlert, Long> {

    <S extends TutorAlert> S save(S alert);

    Optional<TutorAlert> findByIdAndTutorId(Long id, Long tutorId);

    Optional<TutorAlert> findByTutorIdAndDeduplicationKey(Long tutorId, String deduplicationKey);

    List<TutorAlert> findAllByTutorIdAndAlertStatusOrderByCreatedAtDesc(
        Long tutorId,
        TutorAlert.AlertStatus alertStatus
    );
}
