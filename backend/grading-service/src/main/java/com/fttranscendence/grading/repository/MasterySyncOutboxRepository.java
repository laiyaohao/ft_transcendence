package com.fttranscendence.grading.repository;

import com.fttranscendence.grading.model.MasterySyncOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterySyncOutboxRepository extends JpaRepository<MasterySyncOutbox, Long> {
    List<MasterySyncOutbox> findTop25ByDeliveredAtIsNullOrderByIdAsc();
}
