package com.fttranscendence.grading.repository;
import com.fttranscendence.grading.ocr.OcrExtraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OcrExtractionRepository extends JpaRepository<OcrExtraction, Long> {
    List<OcrExtraction> findByPageDocumentIdOrderByPagePageNumberAsc(Long documentId);
}
