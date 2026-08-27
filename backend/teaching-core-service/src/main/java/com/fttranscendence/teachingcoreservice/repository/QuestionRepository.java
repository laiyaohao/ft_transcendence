package com.fttranscendence.teachingcoreservice.repository;

import com.fttranscendence.teachingcoreservice.model.Question;
import com.fttranscendence.teachingcoreservice.model.SyllabusTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByTopic(SyllabusTopic topic);
    
    @Query("SELECT q FROM Question q JOIN q.tags t WHERE t.tagName = :tagName")
    List<Question> findByTagName(@Param("tagName") String tagName);
    
    List<Question> findByDifficulty(String difficulty);
}