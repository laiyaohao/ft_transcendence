package com.fttranscendence.learning.student;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface StudentProfileRepository extends Repository<StudentProfile, Long> {

    <S extends StudentProfile> S save(S studentProfile);

    Optional<StudentProfile> findByIdAndTutorId(Long id, Long tutorId);

    Optional<StudentProfile> findByLoginUserId(Long loginUserId);

    List<StudentProfile> findAllByTutorIdOrderByFullNameAsc(Long tutorId);

    boolean existsByLoginUserId(Long loginUserId);
}

