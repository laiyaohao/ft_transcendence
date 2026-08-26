package com.fttranscendence.learning.student;

import com.fttranscendence.learning.classroom.TutorClass;
import com.fttranscendence.learning.classroom.TutorClassRepository;
import jakarta.persistence.EntityManager;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class StudentService {

    private final StudentProfileRepository students;
    private final TutorClassRepository classes;
    private final EntityManager entityManager;

    public StudentService(
        StudentProfileRepository students,
        TutorClassRepository classes,
        EntityManager entityManager
    ) {
        this.students = students;
        this.classes = classes;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<StudentRequest.StudentResponse> listOwnedStudents(long tutorId, Long classId) {
        requireTutor(tutorId);
        if (classId != null) {
            requireOwnedClass(tutorId, classId);
        }
        List<StudentProfile> profiles = classId == null
            ? students.findAllByTutorIdOrderByFullNameAsc(tutorId)
            : students.findAllByTutorIdAndClassIdOrderByFullNameAsc(tutorId, classId);
        Map<Long, TutorClass> classesById = ownedClassMap(tutorId);
        return profiles.stream()
            .map(profile -> StudentRequest.StudentResponse.from(profile, classesById))
            .toList();
    }

    @Transactional(readOnly = true)
    public StudentRequest.StudentResponse getOwnedStudent(long tutorId, long studentId) {
        requireTutor(tutorId);
        StudentProfile student = requireOwnedStudent(tutorId, studentId);
        return StudentRequest.StudentResponse.from(student, ownedClassMap(tutorId));
    }

    @Transactional
    public StudentRequest.StudentResponse create(long tutorId, StudentRequest request) {
        requireTutor(tutorId);
        validateRequest(request);
        Map<Long, TutorClass> requestedClasses = resolveRequestedClasses(tutorId, request.classIds());
        ensureLoginIdentityAvailable(request.loginUserId(), null);

        StudentProfile student = new StudentProfile();
        student.setTutorId(tutorId);
        apply(student, request, requestedClasses);
        try {
            StudentProfile saved = students.save(student);
            entityManager.flush();
            return StudentRequest.StudentResponse.from(saved, requestedClasses);
        } catch (DataIntegrityViolationException exception) {
            throw conflictFor(request, exception);
        } catch (DataAccessException exception) {
            throw new StudentPersistenceException(exception);
        }
    }

    @Transactional
    public StudentRequest.StudentResponse update(long tutorId, long studentId, StudentRequest request) {
        requireTutor(tutorId);
        validateRequest(request);
        StudentProfile student = requireOwnedStudent(tutorId, studentId);
        Map<Long, TutorClass> requestedClasses = resolveRequestedClasses(tutorId, request.classIds());
        ensureLoginIdentityAvailable(request.loginUserId(), studentId);

        apply(student, request, requestedClasses);
        try {
            entityManager.flush();
            return StudentRequest.StudentResponse.from(student, requestedClasses);
        } catch (DataIntegrityViolationException exception) {
            throw conflictFor(request, exception);
        } catch (DataAccessException exception) {
            throw new StudentPersistenceException(exception);
        }
    }

    private void apply(
        StudentProfile student,
        StudentRequest request,
        Map<Long, TutorClass> requestedClasses
    ) {
        student.setFullName(request.fullName().trim());
        student.setLoginUserId(request.loginUserId());

        Set<Long> wantedIds = requestedClasses.keySet();
        new ArrayList<>(student.getMemberships()).stream()
            .filter(membership -> !wantedIds.contains(membership.getClassId()))
            .forEach(student::removeClassMembership);
        Set<Long> currentIds = student.getMemberships().stream()
            .map(ClassMembership::getClassId)
            .collect(java.util.stream.Collectors.toSet());
        wantedIds.stream()
            .filter(classId -> !currentIds.contains(classId))
            .sorted()
            .forEach(student::addClassMembership);
    }

    private Map<Long, TutorClass> resolveRequestedClasses(long tutorId, List<Long> classIds) {
        Set<Long> uniqueIds = new HashSet<>();
        for (Long classId : classIds) {
            if (!uniqueIds.add(classId)) {
                throw new DuplicateMembershipException(classId);
            }
        }
        Map<Long, TutorClass> owned = ownedClassMap(tutorId);
        for (Long classId : uniqueIds) {
            if (!owned.containsKey(classId)) {
                throw new ClassNotFoundException(classId);
            }
        }
        return owned.entrySet().stream()
            .filter(entry -> uniqueIds.contains(entry.getKey()))
            .sorted(Map.Entry.comparingByKey())
            .collect(java.util.stream.Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (left, right) -> left,
                java.util.LinkedHashMap::new
            ));
    }

    private Map<Long, TutorClass> ownedClassMap(long tutorId) {
        Map<Long, TutorClass> result = new HashMap<>();
        for (TutorClass tutorClass : classes.findAllByTutorIdOrderByClassNameAsc(tutorId)) {
            result.put(tutorClass.getId(), tutorClass);
        }
        return result;
    }

    private void ensureLoginIdentityAvailable(Long loginUserId, Long currentStudentId) {
        if (loginUserId == null) {
            return;
        }
        students.findByLoginUserId(loginUserId)
            .filter(existing -> currentStudentId == null || !currentStudentId.equals(existing.getId()))
            .ifPresent(existing -> {
                throw new LoginIdentityConflictException(loginUserId);
            });
    }

    private StudentProfile requireOwnedStudent(long tutorId, long studentId) {
        return students.findByIdAndTutorId(studentId, tutorId)
            .orElseThrow(() -> new StudentNotFoundException(studentId));
    }

    private void requireOwnedClass(long tutorId, long classId) {
        if (!classes.findByIdAndTutorId(classId, tutorId).isPresent()) {
            throw new ClassNotFoundException(classId);
        }
    }

    private void validateRequest(StudentRequest request) {
        if (request == null) {
            throw new InvalidStudentRequestException("Student request is required");
        }
    }

    private void requireTutor(long tutorId) {
        if (tutorId <= 0) {
            throw new InvalidStudentRequestException("Authenticated tutor id must be positive");
        }
    }

    private RuntimeException conflictFor(StudentRequest request, DataIntegrityViolationException exception) {
        if (request.loginUserId() != null) {
            return new LoginIdentityConflictException(request.loginUserId(), exception);
        }
        return new StudentPersistenceException(exception);
    }

    public static class StudentNotFoundException extends RuntimeException {
        public StudentNotFoundException(long studentId) {
            super("Student " + studentId + " was not found for this tutor");
        }
    }

    public static class ClassNotFoundException extends RuntimeException {
        public ClassNotFoundException(long classId) {
            super("Class " + classId + " was not found for this tutor");
        }
    }

    public static class DuplicateMembershipException extends RuntimeException {
        public DuplicateMembershipException(long classId) {
            super("Class " + classId + " appears more than once in this student request");
        }
    }

    public static class LoginIdentityConflictException extends RuntimeException {
        public LoginIdentityConflictException(long loginUserId) {
            super("Login identity " + loginUserId + " is already linked to another student");
        }

        public LoginIdentityConflictException(long loginUserId, Throwable cause) {
            super("Login identity " + loginUserId + " is already linked to another student", cause);
        }
    }

    public static class InvalidStudentRequestException extends RuntimeException {
        public InvalidStudentRequestException(String message) {
            super(message);
        }
    }

    public static class StudentPersistenceException extends RuntimeException {
        public StudentPersistenceException(Throwable cause) {
            super("Student data could not be saved", cause);
        }
    }
}
