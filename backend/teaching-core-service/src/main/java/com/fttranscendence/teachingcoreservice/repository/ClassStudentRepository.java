package com.fttranscendence.teachingcoreservice.repository;

import com.fttranscendence.teachingcoreservice.model.ClassStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassStudentRepository extends JpaRepository<ClassStudent, Long> {
    List<ClassStudent> findByClassEntityId(Long classId);
    List<ClassStudent> findByStudentId(Long studentId);
    boolean existsByClassEntityIdAndStudentId(Long classId, Long studentId);
    void deleteByClassEntityIdAndStudentId(Long classId, Long studentId);
}