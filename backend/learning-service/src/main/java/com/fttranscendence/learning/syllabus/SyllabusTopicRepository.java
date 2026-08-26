package com.fttranscendence.learning.syllabus;

import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface SyllabusTopicRepository extends Repository<SyllabusTopic, Long> {

    Optional<SyllabusTopic> findByCode(String code);

    List<SyllabusTopic> findAllByParentIdAndActiveTrueOrderBySortOrderAscCodeAsc(Long parentId);

    List<SyllabusTopic> findAllByNodeTypeAndActiveTrueOrderBySortOrderAscCodeAsc(
        SyllabusTopic.NodeType nodeType
    );

    List<SyllabusTopic> findAllById(Iterable<Long> ids);

    long countByCurriculumVersionAndActiveTrue(String curriculumVersion);
}
