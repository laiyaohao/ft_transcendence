package com.fttranscendence.teachingcoreservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuestionDTO {
    private Long id;
    private Long topicId;
    private String questionText;
    private String modelAnswer;
    private String solutionSteps;
    private String difficulty;
    private String questionType;
    private Long sourceFileId;
    private List<QuestionTagDTO> tags;
}