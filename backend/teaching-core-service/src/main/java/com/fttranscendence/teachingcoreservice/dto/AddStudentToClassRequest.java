package com.fttranscendence.teachingcoreservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddStudentToClassRequest {
    @NotNull(message = "Student ID is required")
    private Long studentId;
}