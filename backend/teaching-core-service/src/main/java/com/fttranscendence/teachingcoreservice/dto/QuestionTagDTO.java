package com.fttranscendence.teachingcoreservice.dto;

import com.fttranscendence.teachingcoreservice.model.TagType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestionTagDTO {
    private Long id;
    private String tagName;
    private TagType tagType;
}