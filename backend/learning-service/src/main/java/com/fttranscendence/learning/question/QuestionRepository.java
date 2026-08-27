package com.fttranscendence.learning.question;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends Repository<Question, Long> {

    <S extends Question> S save(S question);

    Optional<Question> findByCode(String code);

    Optional<Question> findById(Long id);

    boolean existsByCode(String code);

    @Query("""
        select case when count(worksheetQuestion) > 0 then true else false end
        from WorksheetQuestion worksheetQuestion
        where worksheetQuestion.question.id = :questionId
        """)
    boolean isUsedByAnyWorksheet(@Param("questionId") Long questionId);

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

    @Query(
        value = """
            select question
            from Question question
            join fetch question.syllabusTopic topic
            where (:topicId is null or topic.id = :topicId)
              and (:questionType is null or question.questionType = :questionType)
              and question.archiveState = :archiveState
            order by question.code asc, question.id asc
            """,
        countQuery = """
            select count(question)
            from Question question
            where (:topicId is null or question.syllabusTopic.id = :topicId)
              and (:questionType is null or question.questionType = :questionType)
              and question.archiveState = :archiveState
            """
    )
    Page<Question> findQuestionBank(
        @Param("topicId") Long topicId,
        @Param("questionType") Question.QuestionType questionType,
        @Param("archiveState") Question.ArchiveState archiveState,
        Pageable pageable
    );
}
