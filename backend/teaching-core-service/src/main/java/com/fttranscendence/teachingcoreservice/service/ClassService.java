package com.fttranscendence.teachingcoreservice.service;

import com.fttranscendence.teachingcoreservice.client.ProfileServiceClient;
import com.fttranscendence.teachingcoreservice.client.StudentDTO;
import com.fttranscendence.teachingcoreservice.client.TutorDTO;
import com.fttranscendence.teachingcoreservice.dto.AddStudentToClassRequest;
import com.fttranscendence.teachingcoreservice.dto.ClassDTO;
import com.fttranscendence.teachingcoreservice.dto.CreateClassRequest;
import com.fttranscendence.teachingcoreservice.model.Class;
import com.fttranscendence.teachingcoreservice.model.ClassStudent;
import com.fttranscendence.teachingcoreservice.model.Level;
import com.fttranscendence.teachingcoreservice.model.Subject;
import com.fttranscendence.teachingcoreservice.repository.ClassRepository;
import com.fttranscendence.teachingcoreservice.repository.ClassStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassService {
    private final ClassRepository classRepository;
    private final ClassStudentRepository classStudentRepository;
    private final ProfileServiceClient profileServiceClient;

    @Transactional
    public ClassDTO createClass(CreateClassRequest request) {
        // 1. Verify tutor exists in Profile Service
        TutorDTO tutor = profileServiceClient.getTutorById(request.getTutorId());
        
        // 2. Create class
        Class newClass = new Class();
        newClass.setTutorId(request.getTutorId());
        newClass.setClassName(request.getClassName());
        newClass.setLevel(Level.valueOf(request.getLevel()));
        newClass.setSubject(Subject.valueOf(request.getSubject()));
        newClass.setSchedule(request.getSchedule());

        Class saved = classRepository.save(newClass);

        // 3. Build response with tutor name
        return mapToDTO(saved, tutor);
    }

    @Transactional
    public void addStudentToClass(Long classId, AddStudentToClassRequest request) {
        // 1. Verify class exists
        Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found: " + classId));

        // 2. Verify student exists in Profile Service
        StudentDTO student = profileServiceClient.getStudentById(request.getStudentId());

        // 3. Check if student is already in class
        if (classStudentRepository.existsByClassEntityIdAndStudentId(classId, request.getStudentId())) {
            throw new RuntimeException("Student already enrolled in this class");
        }

        // 4. Add student to class
        ClassStudent classStudent = new ClassStudent();
        classStudent.setClassEntity(classEntity);
        classStudent.setStudentId(request.getStudentId());
        classStudentRepository.save(classStudent);
    }

    @Transactional
    public void removeStudentFromClass(Long classId, Long studentId) {
        if (!classStudentRepository.existsByClassEntityIdAndStudentId(classId, studentId)) {
            throw new RuntimeException("Student not enrolled in this class");
        }
        classStudentRepository.deleteByClassEntityIdAndStudentId(classId, studentId);
    }

    public ClassDTO getClassById(Long id) {
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found: " + id));
        
        // Fetch tutor details from Profile Service
        TutorDTO tutor = profileServiceClient.getTutorById(classEntity.getTutorId());
        
        // Fetch student details for all enrolled students
        List<StudentDTO> students = classStudentRepository.findByClassEntityId(id)
                .stream()
                .map(cs -> profileServiceClient.getStudentById(cs.getStudentId()))
                .collect(Collectors.toList());

        return mapToDTO(classEntity, tutor, students);
    }

    public List<ClassDTO> getClassesByTutorId(Long tutorId) {
        // Verify tutor exists
        TutorDTO tutor = profileServiceClient.getTutorById(tutorId);
        
        return classRepository.findByTutorId(tutorId)
                .stream()
                .map(c -> mapToDTO(c, tutor))
                .collect(Collectors.toList());
    }

    private ClassDTO mapToDTO(Class classEntity, TutorDTO tutor) {
        return ClassDTO.builder()
                .id(classEntity.getId())
                .tutorId(classEntity.getTutorId())
                .className(classEntity.getClassName())
                .level(classEntity.getLevel())
                .subject(classEntity.getSubject())
                .schedule(classEntity.getSchedule())
                .build();
    }

    private ClassDTO mapToDTO(Class classEntity, TutorDTO tutor, List<StudentDTO> students) {
        ClassDTO dto = mapToDTO(classEntity, tutor);
        dto.setStudents(students);
        return dto;
    }
}