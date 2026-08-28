package com.fttranscendence.grading.service;

import com.fttranscendence.grading.security.AuthenticatedUser;
import com.fttranscendence.grading.model.MasterySyncOutbox;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class LearningAuthorizationClient {
    private final RestTemplate rest;

    @Value("${learning.service.url:http://localhost:8083}")
    private String base;

    @Value("${learning.service.sync-key}")
    private String syncKey;

    public LearningAuthorizationClient(RestTemplate rest) {
        this.rest = rest;
    }

    public void assertCanSubmit(AuthenticatedUser user, String bearer, long studentId) {
        String path = "STUDENT".equals(user.role())
            ? "/api/learning/student/profile"
            : "/api/learning/tutor/students/" + studentId;
        try {
            ResponseEntity<Map> response = get(bearer, path);
            if (!response.getStatusCode().is2xxSuccessful()
                || ("STUDENT".equals(user.role()) && !sameId(response.getBody(), studentId))) {
                throw new Forbidden();
            }
        } catch (Forbidden exception) {
            throw exception;
        } catch (Exception exception) {
            throw new Forbidden();
        }
    }

    /** A marking decision is a protected Tutor action for a linked student. */
    public void assertCanReview(AuthenticatedUser user, String bearer, long studentId) {
        if (user == null || !"TUTOR".equals(user.role())) {
            throw new Forbidden();
        }
        try {
            if (!get(bearer, "/api/learning/tutor/students/" + studentId).getStatusCode().is2xxSuccessful()) {
                throw new Forbidden();
            }
        } catch (Forbidden exception) {
            throw exception;
        } catch (Exception exception) {
            throw new Forbidden();
        }
    }

    /** Loads the question and its marking rubric through the existing owner-scoped learning API. */
    public QuestionContext loadQuestion(AuthenticatedUser user, String bearer, long questionBankId) {
        if (user == null || !"TUTOR".equals(user.role())) {
            throw new Forbidden();
        }
        try {
            Map<?, ?> body = get(bearer, "/api/learning/tutor/questions/" + questionBankId).getBody();
            if (body == null) {
                throw new QuestionUnavailable();
            }
            String prompt = text(body.get("prompt"));
            String modelAnswer = text(body.get("modelAnswer"));
            BigDecimal totalMarks = decimal(body.get("totalMarks"));
            List<String> keywords = strings(body.get("keywords"));
            List<String> criteria = criteria(body.get("markingComponents"));
            TopicContext topic = topic(body.get("syllabusTopic"));
            if (prompt == null || modelAnswer == null || totalMarks == null || totalMarks.signum() <= 0 || criteria.isEmpty() || topic == null) {
                throw new QuestionUnavailable();
            }
            return new QuestionContext(prompt, modelAnswer, totalMarks, criteria, keywords, topic.id(), topic.code());
        } catch (Forbidden | QuestionUnavailable exception) {
            throw exception;
        } catch (Exception exception) {
            throw new QuestionUnavailable();
        }
    }

    /**
     * Verifies the Tutor-owned worksheet, its question, and its assignment to
     * the selected student before a page-less manual result is recorded.
     */
    public QuestionContext validateManualResultContext(
        AuthenticatedUser user,
        String bearer,
        long studentId,
        long worksheetId,
        long questionBankId
    ) {
        if (user == null || !"TUTOR".equals(user.role())) {
            throw new Forbidden();
        }
        try {
            Map<?, ?> student = get(bearer, "/api/learning/tutor/students/" + studentId).getBody();
            Map<?, ?> worksheet = get(bearer, "/api/learning/tutor/worksheets/" + worksheetId).getBody();
            if (!sameId(student, studentId) || !sameId(worksheet, worksheetId)
                || !"APPROVED".equals(worksheet.get("status"))
                || !hasQuestion(worksheet, questionBankId)
                || !isAssignedToStudent(worksheet, student, studentId)) {
                throw new ManualResultContextNotFound();
            }
            QuestionContext question = loadQuestion(user, bearer, questionBankId);
            if (!question.totalMarks().equals(questionMarks(worksheet, questionBankId))) {
                throw new ManualResultContextNotFound();
            }
            return question;
        } catch (Forbidden | QuestionUnavailable | ManualResultContextNotFound exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ManualResultContextNotFound();
        }
    }

    private ResponseEntity<Map> get(String bearer, String path) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, bearer);
        return rest.exchange(base + path, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    /** Uses a backend-only integration key; public user JWTs are not trusted for this write. */
    public void sync(MasterySyncOutbox.EventType eventType, String payload) {
        if (syncKey == null || syncKey.isBlank()) {
            throw new LearningSyncUnavailable("Learning synchronization is not configured");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Learning-Integration-Key", syncKey);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<Void> response = rest.exchange(
                base + switch (eventType) {
                    case APPROVED_MARKING -> "/api/learning/internal/approved-marking-evidence";
                    case MARKING_REVIEW_STATE -> "/api/learning/internal/marking-review-state";
                },
                HttpMethod.POST,
                new HttpEntity<>(payload, headers),
                Void.class
            );
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new LearningSyncUnavailable("Learning synchronization was rejected");
            }
        } catch (LearningSyncUnavailable exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LearningSyncUnavailable("Learning synchronization is temporarily unavailable");
        }
    }

    private static boolean sameId(Map<?, ?> body, long expected) {
        Object id = body == null ? null : body.get("id");
        return id instanceof Number number && number.longValue() == expected;
    }

    private static boolean hasQuestion(Map<?, ?> worksheet, long questionBankId) {
        return questionMarks(worksheet, questionBankId) != null;
    }

    private static BigDecimal questionMarks(Map<?, ?> worksheet, long questionBankId) {
        Object questions = worksheet == null ? null : worksheet.get("questions");
        if (!(questions instanceof List<?> values)) return null;
        for (Object value : values) {
            if (value instanceof Map<?, ?> question && sameId(question, questionBankId)) {
                return decimal(question.get("totalMarks"));
            }
        }
        return null;
    }

    private static boolean isAssignedToStudent(Map<?, ?> worksheet, Map<?, ?> student, long studentId) {
        Object assignments = worksheet == null ? null : worksheet.get("assignments");
        if (!(assignments instanceof List<?> values)) return false;
        for (Object value : values) {
            if (!(value instanceof Map<?, ?> assignment)) continue;
            if ("STUDENT".equals(assignment.get("assignmentType"))
                && sameIdValue(assignment.get("studentProfileId"), studentId)) return true;
            if ("CLASS".equals(assignment.get("assignmentType")) && studentIsInClass(student, assignment.get("classId"))) return true;
        }
        return false;
    }

    private static boolean studentIsInClass(Map<?, ?> student, Object classId) {
        Object classes = student == null ? null : student.get("classes");
        if (!(classes instanceof List<?> values)) return false;
        return values.stream().filter(Map.class::isInstance).map(Map.class::cast)
            .anyMatch(item -> sameIdValue(item.get("id"), classId));
    }

    private static boolean sameIdValue(Object first, Object second) {
        return first instanceof Number left && second instanceof Number right && left.longValue() == right.longValue();
    }

    private static String text(Object value) {
        return value instanceof String string && !string.isBlank() ? string.trim() : null;
    }

    private static BigDecimal decimal(Object value) {
        try {
            return value == null ? null : new BigDecimal(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static List<String> strings(Object value) {
        if (!(value instanceof List<?> values)) {
            return List.of();
        }
        return values.stream().filter(String.class::isInstance).map(String.class::cast)
            .map(String::trim).filter(item -> !item.isBlank()).distinct().toList();
    }

    private static List<String> criteria(Object value) {
        if (!(value instanceof List<?> values)) {
            return List.of();
        }
        return values.stream().filter(Map.class::isInstance).map(Map.class::cast)
            .map(component -> text(component.get("description"))).filter(Objects::nonNull).toList();
    }

    private static TopicContext topic(Object value) {
        if (!(value instanceof Map<?, ?> topic)) return null;
        Object id = topic.get("id");
        String code = text(topic.get("code"));
        if (!(id instanceof Number number) || number.longValue() <= 0 || code == null) return null;
        return new TopicContext(number.longValue(), code);
    }

    public record QuestionContext(
        String prompt,
        String modelAnswer,
        BigDecimal totalMarks,
        List<String> markingCriteria,
        List<String> keywords,
        Long syllabusTopicId,
        String syllabusTopicCode
    ) { }

    private record TopicContext(long id, String code) { }

    public static class Forbidden extends RuntimeException { }
    public static class QuestionUnavailable extends RuntimeException { }
    public static class ManualResultContextNotFound extends RuntimeException { }
    public static class LearningSyncUnavailable extends RuntimeException {
        public LearningSyncUnavailable(String message) { super(message); }
    }
}
