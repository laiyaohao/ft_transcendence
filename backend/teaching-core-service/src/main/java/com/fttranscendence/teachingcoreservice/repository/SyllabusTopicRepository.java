package com.fttranscendence.teachingcoreservice.repository;

import com.fttranscendence.teachingcoreservice.model.SyllabusTopic;
import com.fttranscendence.teachingcoreservice.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SyllabusTopicRepository extends JpaRepository<SyllabusTopic, Long> {
    List<SyllabusTopic> findBySubjectAndLevel(Subject subject, Integer level);
    List<SyllabusTopic> findByTopicContainingIgnoreCase(String topic);
    boolean existsByTopicAndSubtopicAndSubject(String topic, String subtopic, Subject subject);
}