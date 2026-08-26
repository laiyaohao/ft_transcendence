package com.fttranscendence.learning.insight;

import org.springframework.data.repository.Repository;
import java.util.List;

public interface ClassInsightSnapshotRepository extends Repository<ClassInsightSnapshot, Long> {
    List<ClassInsightSnapshot> findTop1ByTutorIdAndClassIdOrderByIdDesc(Long tutorId, Long classId);
}
