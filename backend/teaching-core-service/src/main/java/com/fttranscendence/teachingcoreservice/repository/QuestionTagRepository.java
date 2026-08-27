package com.fttranscendence.teachingcoreservice.repository;

import com.fttranscendence.teachingcoreservice.model.QuestionTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionTagRepository extends JpaRepository<QuestionTag, Long> {
    List<QuestionTag> findByQuestionId(Long questionId);
    List<QuestionTag> findByTagName(String tagName);
}