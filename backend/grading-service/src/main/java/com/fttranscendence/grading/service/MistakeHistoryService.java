package com.fttranscendence.grading.service;

import com.fttranscendence.grading.model.MistakeRecord;
import com.fttranscendence.grading.repository.MistakeRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Read-only projection of Tutor-approved, canonical mistake history. */
@Service
public class MistakeHistoryService {
    private final MistakeRecordRepository mistakes;

    public MistakeHistoryService(MistakeRecordRepository mistakes) {
        this.mistakes = mistakes;
    }

    @Transactional(readOnly = true)
    public List<MistakeHistoryItem> historyFor(long studentId) {
        if (studentId <= 0) throw new IllegalArgumentException("Student id must be positive.");
        return mistakes.findByStudentIdOrderByCreatedAtDescIdDesc(studentId).stream()
            .map(MistakeHistoryItem::from)
            .toList();
    }

    public record MistakeHistoryItem(
        long id,
        long worksheetId,
        long worksheetQuestionId,
        long questionBankId,
        Long syllabusTopicId,
        String syllabusTopicCode,
        String mistakeType,
        String mistakeLabel,
        String description,
        LocalDateTime recordedAt
    ) {
        static MistakeHistoryItem from(MistakeRecord record) {
            return new MistakeHistoryItem(
                record.getId(), record.getWorksheetId(), record.getWorksheetQuestionId(), record.getQuestionBankId(),
                record.getSyllabusTopicId(), record.getSyllabusTopicCode(), record.getMistakeType().name(),
                record.getMistakeType().getLabel(), record.getDescription(), record.getCreatedAt()
            );
        }
    }
}
