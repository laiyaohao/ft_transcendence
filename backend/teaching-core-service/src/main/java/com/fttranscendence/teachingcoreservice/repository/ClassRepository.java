package com.fttranscendence.teachingcoreservice.repository;

import com.fttranscendence.teachingcoreservice.model.Class;
import com.fttranscendence.teachingcoreservice.model.Level;
import com.fttranscendence.teachingcoreservice.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<Class, Long> {
    List<Class> findByTutorId(Long tutorId);
    List<Class> findBySubjectAndLevel(Subject subject, Level level);
    List<Class> findByClassNameContainingIgnoreCase(String className);
}