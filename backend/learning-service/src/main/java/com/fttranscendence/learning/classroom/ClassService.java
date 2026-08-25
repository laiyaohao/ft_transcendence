package com.fttranscendence.learning.classroom;

import jakarta.persistence.EntityManager;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ClassService {

    private final TutorClassRepository repository;
    private final EntityManager entityManager;

    public ClassService(TutorClassRepository repository, EntityManager entityManager) {
        this.repository = repository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<ClassRequest.ClassResponse> listOwnedClasses(long tutorId) {
        requireTutor(tutorId);
        return ownedClasses(tutorId).stream()
            .map(ClassRequest.ClassResponse::from)
            .toList();
    }

    @Transactional
    public ClassRequest.ClassResponse create(long tutorId, ClassRequest request) {
        requireTutor(tutorId);
        validateRequest(request);
        ensureNameAvailable(tutorId, request.className(), null);

        TutorClass tutorClass = new TutorClass();
        tutorClass.setTutorId(tutorId);
        applyRequest(tutorClass, request, true);
        try {
            TutorClass saved = repository.save(tutorClass);
            entityManager.flush();
            return ClassRequest.ClassResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateClassException(request.className(), exception);
        } catch (DataAccessException exception) {
            throw new ClassPersistenceException(exception);
        }
    }

    @Transactional
    public ClassRequest.ClassResponse update(long tutorId, long classId, ClassRequest request) {
        requireTutor(tutorId);
        validateRequest(request);
        TutorClass tutorClass = repository.findByIdAndTutorId(classId, tutorId)
            .orElseThrow(() -> new ClassNotFoundException(classId));
        ensureNameAvailable(tutorId, request.className(), classId);

        applyRequest(tutorClass, request, false);
        try {
            entityManager.flush();
            return ClassRequest.ClassResponse.from(tutorClass);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateClassException(request.className(), exception);
        } catch (DataAccessException exception) {
            throw new ClassPersistenceException(exception);
        }
    }

    private List<TutorClass> ownedClasses(long tutorId) {
        List<TutorClass> classes = new ArrayList<>();
        classes.addAll(repository.findAllByTutorIdAndStatusOrderByClassNameAsc(
            tutorId,
            TutorClass.Status.ACTIVE
        ));
        classes.addAll(repository.findAllByTutorIdAndStatusOrderByClassNameAsc(
            tutorId,
            TutorClass.Status.INACTIVE
        ));
        return classes.stream()
            .sorted(Comparator.comparing(TutorClass::getClassName,
                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                .thenComparing(TutorClass::getId,
                    Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
    }

    private void applyRequest(TutorClass tutorClass, ClassRequest request, boolean creating) {
        tutorClass.setClassName(request.className().trim());
        tutorClass.setSubject(request.subject().trim());
        tutorClass.setLevel(request.level().trim());
        if (request.status() != null) {
            tutorClass.setStatus(request.status());
        } else if (creating) {
            tutorClass.setStatus(TutorClass.Status.ACTIVE);
        }

        Set<TutorClass.ScheduleSlot> schedules = new LinkedHashSet<>();
        for (ClassRequest.ScheduleRequest schedule : request.schedules()) {
            if (schedule == null || schedule.dayOfWeek() == null
                || schedule.startTime() == null || schedule.endTime() == null) {
                throw new InvalidClassRequestException("Every schedule requires a day and start/end time");
            }
            LocalTime start = schedule.startTime();
            LocalTime end = schedule.endTime();
            if (!start.isBefore(end)) {
                throw new InvalidClassRequestException("Schedule start time must be before end time");
            }
            TutorClass.ScheduleSlot slot = new TutorClass.ScheduleSlot(
                schedule.dayOfWeek(),
                start,
                end
            );
            if (!schedules.add(slot)) {
                throw new InvalidClassRequestException("Duplicate schedule entries are not allowed");
            }
        }
        tutorClass.setSchedules(schedules);
    }

    private void validateRequest(ClassRequest request) {
        if (request == null) {
            throw new InvalidClassRequestException("Class request is required");
        }
    }

    private void ensureNameAvailable(long tutorId, String name, Long currentClassId) {
        String normalized = name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
        boolean duplicate = ownedClasses(tutorId).stream()
            .filter(existing -> currentClassId == null || !currentClassId.equals(existing.getId()))
            .map(TutorClass::getClassName)
            .filter(existing -> existing != null)
            .map(existing -> existing.trim().toLowerCase(Locale.ROOT))
            .anyMatch(normalized::equals);
        if (duplicate || repository.existsByTutorIdAndClassNameIgnoreCase(tutorId, name.trim())) {
            if (currentClassId == null || !ownedClasses(tutorId).stream()
                .filter(existing -> currentClassId.equals(existing.getId()))
                .anyMatch(existing -> existing.getClassName().trim().equalsIgnoreCase(name.trim()))) {
                throw new DuplicateClassException(name);
            }
        }
    }

    private void requireTutor(long tutorId) {
        if (tutorId <= 0) {
            throw new InvalidClassRequestException("Authenticated tutor id must be positive");
        }
    }

    public static class ClassNotFoundException extends RuntimeException {
        public ClassNotFoundException(long classId) {
            super("Class " + classId + " was not found for this tutor");
        }
    }

    public static class DuplicateClassException extends RuntimeException {
        public DuplicateClassException(String className) {
            super("A class named '" + className.trim() + "' already exists for this tutor");
        }

        public DuplicateClassException(String className, Throwable cause) {
            super("A class named '" + className.trim() + "' already exists for this tutor", cause);
        }
    }

    public static class InvalidClassRequestException extends RuntimeException {
        public InvalidClassRequestException(String message) {
            super(message);
        }
    }

    public static class ClassPersistenceException extends RuntimeException {
        public ClassPersistenceException(Throwable cause) {
            super("Class data could not be saved", cause);
        }
    }
}
