package com.fttranscendence.teachingcoreservice.dto;

import com.fttranscendence.teachingcoreservice.client.StudentDTO;
import com.fttranscendence.teachingcoreservice.model.Level;
import com.fttranscendence.teachingcoreservice.model.Subject;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ClassDTO {
    private Long id;
    private Long tutorId;
    // private String tutorName;  // From Profile Service
    private String className;
    private Level level;
    private Subject subject;
    private String schedule;
    private List<StudentDTO> students;  // From Profile Service
}