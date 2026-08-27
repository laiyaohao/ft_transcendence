package com.fttranscendence.teachingcoreservice.dto;

import com.fttranscendence.teachingcoreservice.model.Subject;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SyllabusTopicDTO {
    private Long id;
    private Integer level;
    private Subject subject;
    private String topic;
    private String subtopic;
    private String description;
}