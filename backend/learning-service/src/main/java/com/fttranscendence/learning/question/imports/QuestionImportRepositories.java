package com.fttranscendence.learning.question.imports;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

interface QuestionImportBatchRepository extends Repository<QuestionImportBatch, Long> {
    <S extends QuestionImportBatch> S save(S batch);
    Optional<QuestionImportBatch> findById(Long id);
}

interface QuestionImportSourcePageRepository extends Repository<QuestionImportSourcePage, Long> {
    <S extends QuestionImportSourcePage> S save(S page);
    Optional<QuestionImportSourcePage> findByIdAndBatch_Id(Long id, Long batchId);
}

interface QuestionImportCandidateRepository extends Repository<QuestionImportCandidate, Long> {
    <S extends QuestionImportCandidate> S save(S candidate);
    @Query("""
        select candidate from QuestionImportCandidate candidate
        join fetch candidate.sourcePage page
        left join fetch candidate.syllabusTopic topic
        where candidate.batch.id = :batchId
        order by page.sourceFilename asc, page.sourcePageNumber asc, candidate.candidateNumber asc
        """)
    List<QuestionImportCandidate> findAllForBatch(Long batchId);
    Optional<QuestionImportCandidate> findByIdAndBatch_Id(Long id, Long batchId);
}
