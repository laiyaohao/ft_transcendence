package com.fttranscendence.learning.worksheet;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorksheetRepository extends Repository<Worksheet, Long> {

    <S extends Worksheet> S save(S worksheet);

    Optional<Worksheet> findByIdAndTutorId(Long id, Long tutorId);

    Optional<Worksheet> findByTutorIdAndCode(Long tutorId, String code);

    List<Worksheet> findAllByTutorIdAndStatusOrderByTitleAsc(
        Long tutorId,
        Worksheet.Status status
    );

    @Query("""
        SELECT DISTINCT worksheet
        FROM Worksheet worksheet
        JOIN worksheet.assignments assignment
        WHERE assignment.assignmentType = :assignmentType
          AND assignment.targetId = :targetId
        ORDER BY worksheet.title ASC
        """)
    List<Worksheet> findAssignedWorksheets(
        @Param("assignmentType") Worksheet.AudienceType assignmentType,
        @Param("targetId") Long targetId
    );

    @Query("""
        SELECT DISTINCT worksheet
        FROM Worksheet worksheet
        JOIN FETCH worksheet.assignments assignment
        WHERE worksheet.tutorId = :tutorId
          AND assignment.assignmentType = com.fttranscendence.learning.worksheet.Worksheet.AudienceType.CLASS
          AND assignment.targetId = :classId
        ORDER BY worksheet.title ASC, worksheet.id ASC
        """)
    List<Worksheet> findClassAssignedWorksheetsByTutorId(
        @Param("tutorId") Long tutorId,
        @Param("classId") Long classId
    );
}
