package com.fttranscendence.learning.mastery;

import org.springframework.data.repository.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MasteryRecordRepository extends Repository<MasteryRecord, Long> {

    <S extends MasteryRecord> S save(S record);

    Optional<MasteryRecord> findByStudentProfileIdAndSyllabusTopicId(
        Long studentProfileId,
        Long syllabusTopicId
    );

    List<MasteryRecord> findAllByStudentProfileIdOrderByScoreDesc(Long studentProfileId);

    @Query("""
        select mastery
        from MasteryRecord mastery
        join fetch mastery.syllabusTopic topic
        where mastery.studentProfile.id in :studentProfileIds
        order by mastery.studentProfile.id asc, topic.name asc, topic.id asc
        """)
    List<MasteryRecord> findAllByStudentProfileIdInWithTopic(
        @Param("studentProfileIds") List<Long> studentProfileIds
    );
}
