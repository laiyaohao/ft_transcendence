package com.fttranscendence.learning.question;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends Repository<Question, Long> {

    <S extends Question> S save(S question);

    Optional<Question> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        SELECT question
        FROM Question question
        WHERE question.syllabusTopic.id = :syllabusTopicId
          AND question.archiveState = :archiveState
        ORDER BY question.code ASC
        """)
    List<Question> findAllBySyllabusTopicAndArchiveState(
        @Param("syllabusTopicId") Long syllabusTopicId,
        @Param("archiveState") Question.ArchiveState archiveState
    );
}
