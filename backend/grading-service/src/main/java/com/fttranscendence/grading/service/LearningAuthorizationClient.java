package com.fttranscendence.grading.service;

import com.fttranscendence.grading.security.AuthenticatedUser;
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
            if (prompt == null || modelAnswer == null || totalMarks == null || totalMarks.signum() <= 0 || criteria.isEmpty()) {
                throw new QuestionUnavailable();
            }
            return new QuestionContext(prompt, modelAnswer, totalMarks, criteria, keywords);
        } catch (Forbidden | QuestionUnavailable exception) {
            throw exception;
        } catch (Exception exception) {
            throw new QuestionUnavailable();
        }
    }

    private ResponseEntity<Map> get(String bearer, String path) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, bearer);
        return rest.exchange(base + path, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private static boolean sameId(Map<?, ?> body, long expected) {
        Object id = body == null ? null : body.get("id");
        return id instanceof Number number && number.longValue() == expected;
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

    public record QuestionContext(
        String prompt,
        String modelAnswer,
        BigDecimal totalMarks,
        List<String> markingCriteria,
        List<String> keywords
    ) { }

    public static class Forbidden extends RuntimeException { }
    public static class QuestionUnavailable extends RuntimeException { }
}
