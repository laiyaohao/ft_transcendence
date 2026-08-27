package com.fttranscendence.teachingcoreservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateClassRequest {
    @NotNull(message = "Tutor ID is required")
    private Long tutorId;
    
    @NotBlank(message = "Class name is required")
    private String className;
    
    @NotBlank(message = "Level is required")
    private String level;
    
    @NotBlank(message = "Subject is required")
    private String subject;
    
    private String schedule;
}