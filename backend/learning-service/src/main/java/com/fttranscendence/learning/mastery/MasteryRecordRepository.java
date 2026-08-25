package com.fttranscendence.learning.mastery;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface MasteryRecordRepository extends Repository<MasteryRecord, Long> {

    <S extends MasteryRecord> S save(S record);

    Optional<MasteryRecord> findByStudentProfileIdAndSyllabusTopicId(
        Long studentProfileId,
        Long syllabusTopicId
    );

    List<MasteryRecord> findAllByStudentProfileIdOrderByScoreDesc(Long studentProfileId);
}
