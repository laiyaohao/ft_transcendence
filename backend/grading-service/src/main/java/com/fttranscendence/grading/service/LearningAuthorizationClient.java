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
import org.springframework.web.client.HttpClientErrorException;

import java.math.BigDecimal;
import java.util.ArrayDeque;
import java.util.HashMap;
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

    public void assertCanSubmit(AuthenticatedUser user, long studentId, long worksheetId, Long worksheetQuestionId, Long classId) {
        if (user == null || (!"STUDENT".equals(user.role()) && !"TUTOR".equals(user.role()))) {
            throw new Forbidden();
        }
        try {
            if (syncKey == null || syncKey.isBlank()) {
                throw new Forbidden();
            }
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Learning-Integration-Key", syncKey);
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            Map<String, Object> request = new java.util.LinkedHashMap<>();
            request.put("actorUserId", user.userId());
            request.put("actorRole", user.role());
            request.put("studentId", studentId);
            request.put("worksheetId", worksheetId);
            request.put("worksheetQuestionId", worksheetQuestionId);
            request.put("classId", classId);
            ResponseEntity<Void> response = rest.exchange(
                base + "/api/learning/internal/submission-authorization",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                Void.class
            );
            if (!response.getStatusCode().is2xxSuccessful()) throw new Forbidden();
        } catch (Forbidden exception) {
            throw exception;
        } catch (Exception exception) {
            throw new Forbidden();
        }
    }

    /**
     * Internal-only equivalent of the Tutor rubric lookup.  It validates the
     * Student-owned assigned worksheet and returns its question snapshots to
     * Grading, never to the browser.
     */
    public SubmissionMarkingContext loadSubmissionMarkingContext(
        AuthenticatedUser user, long studentId, long worksheetId, Long classId
    ) {
        if (user == null || (!"STUDENT".equals(user.role()) && !"TUTOR".equals(user.role()))) {
            throw new Forbidden();
        }
        try {
            if (syncKey == null || syncKey.isBlank()) throw new Forbidden();
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Learning-Integration-Key", syncKey);
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            Map<String, Object> request = new java.util.LinkedHashMap<>();
            request.put("actorUserId", user.userId());
            request.put("actorRole", user.role());
            request.put("studentId", studentId);
            request.put("worksheetId", worksheetId);
            request.put("classId", classId);
            Map<?, ?> body = rest.exchange(
                base + "/api/learning/internal/submission-authorization/marking-context",
                HttpMethod.POST, new HttpEntity<>(request, headers), Map.class
            ).getBody();
            if (body == null || !(body.get("tutorUserId") instanceof Number tutor) || tutor.longValue() <= 0
                || !(body.get("questions") instanceof List<?> values) || values.isEmpty()) {
                throw new SubmissionMarkingContextUnavailable();
            }
            Map<Long, QuestionContext> questions = new java.util.LinkedHashMap<>();
            for (Object value : values) {
                if (!(value instanceof Map<?, ?> question)) throw new SubmissionMarkingContextUnavailable();
                Object id = question.get("questionBankId");
                String prompt = text(question.get("prompt"));
                String modelAnswer = text(question.get("modelAnswer"));
                BigDecimal totalMarks = decimal(question.get("totalMarks"));
                List<MarkingComponentContext> components = components(question.get("markingComponents"), totalMarks);
                List<String> keywords = strings(question.get("keywords"));
                TopicContext topic = new TopicContext(
                    positiveSubmissionContextId(question.get("syllabusTopicId")),
                    requiredSubmissionContextText(question.get("syllabusTopicCode"))
                );
                if (!(id instanceof Number number) || number.longValue() <= 0 || prompt == null || modelAnswer == null
                    || totalMarks == null || totalMarks.signum() <= 0 || components.isEmpty()
                    || questions.putIfAbsent(number.longValue(), new QuestionContext(prompt, modelAnswer, totalMarks,
                        components.stream().map(MarkingComponentContext::description).toList(), components, keywords,
                        topic.id(), topic.code())) != null) {
                    throw new SubmissionMarkingContextUnavailable();
                }
            }
            return new SubmissionMarkingContext(tutor.longValue(), Map.copyOf(questions));
        } catch (HttpClientErrorException.NotFound exception) {
            // Learning deliberately uses a non-enumerating absent response for
            // a missing or foreign worksheet assignment. It is a context
            // error, not a transient dependency outage.
            throw new SubmissionMarkingContextNotFound();
        } catch (HttpClientErrorException.Forbidden exception) {
            throw new Forbidden();
        } catch (Forbidden | SubmissionMarkingContextNotFound | SubmissionMarkingContextUnavailable exception) {
            throw exception;
        } catch (Exception exception) {
            throw new SubmissionMarkingContextUnavailable();
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

    /**
     * Resolves an actor's mistake-history scope without exposing whether a
     * foreign student identifier exists. Tutors may read owned students only;
     * Students have only a `/me` route resolved from their own login identity.
     */
    public long resolveMistakeHistoryStudent(AuthenticatedUser user, String bearer, Long requestedStudentId) {
        if (user == null) {
            throw new Forbidden();
        }
        if ("TUTOR".equals(user.role())) {
            if (requestedStudentId == null || requestedStudentId <= 0) {
                throw new MistakeHistoryNotFound();
            }
            try {
                Map<?, ?> student = get(bearer, "/api/learning/tutor/students/" + requestedStudentId).getBody();
                if (!sameId(student, requestedStudentId)) {
                    throw new MistakeHistoryNotFound();
                }
                return requestedStudentId;
            } catch (MistakeHistoryNotFound exception) {
                throw exception;
            } catch (Exception exception) {
                throw new MistakeHistoryNotFound();
            }
        }
        if ("STUDENT".equals(user.role()) && requestedStudentId == null) {
            try {
                Map<?, ?> student = get(bearer, "/api/learning/student/profile").getBody();
                Object id = student == null ? null : student.get("id");
                if (!(id instanceof Number number) || number.longValue() <= 0) {
                    throw new MistakeHistoryNotFound();
                }
                return number.longValue();
            } catch (MistakeHistoryNotFound exception) {
                throw exception;
            } catch (Exception exception) {
                throw new MistakeHistoryNotFound();
            }
        }
        throw new Forbidden();
    }

    /**
     * Resolves the authenticated learner and verifies that their filtered
     * worksheet library contains the requested worksheet.  Learning returns
     * the same absent result for a foreign and a missing worksheet, so this
     * grading boundary preserves that non-enumerating behaviour.
     */
    public long resolveStudentWorksheet(AuthenticatedUser user, String bearer, long worksheetId) {
        if (user == null || !"STUDENT".equals(user.role()) || worksheetId <= 0) {
            throw new Forbidden();
        }
        try {
            Map<?, ?> profile = get(bearer, "/api/learning/student/profile").getBody();
            Object profileId = profile == null ? null : profile.get("id");
            if (!(profileId instanceof Number student) || student.longValue() <= 0) {
                throw new StudentWorksheetNotFound();
            }
            List<?> worksheets = getList(bearer, "/api/learning/student/worksheets").getBody();
            boolean assigned = worksheets != null && worksheets.stream()
                .filter(Map.class::isInstance).map(Map.class::cast)
                .anyMatch(worksheet -> sameId(worksheet, worksheetId));
            if (!assigned) {
                throw new StudentWorksheetNotFound();
            }
            return student.longValue();
        } catch (StudentWorksheetNotFound exception) {
            throw exception;
        } catch (Exception exception) {
            throw new StudentWorksheetNotFound();
        }
    }

    /**
     * Loads the public curriculum tree and turns it into immutable topic and
     * subject lookup data.  Grading stores topic snapshots, while the owning
     * subject remains curriculum metadata owned by Learning.
     */
    public SyllabusTaxonomy loadSyllabusTaxonomy(String bearer) {
        try {
            Map<?, ?> body = get(bearer, "/api/learning/shared/syllabus/tree").getBody();
            Object items = body == null ? null : body.get("items");
            if (!(items instanceof List<?> roots)) throw new SyllabusUnavailable();
            Map<Long, SyllabusSubject> subjects = new HashMap<>();
            Map<Long, SyllabusTopic> topics = new HashMap<>();
            ArrayDeque<SyllabusTreeNode> pending = new ArrayDeque<>();
            for (Object root : roots) pending.addLast(new SyllabusTreeNode(root, null));
            while (!pending.isEmpty()) {
                SyllabusTreeNode treeNode = pending.removeFirst();
                if (!(treeNode.value() instanceof Map<?, ?> node)) throw new SyllabusUnavailable();
                long id = positiveId(node.get("id"));
                String name = text(node.get("name"));
                String nodeType = text(node.get("nodeType"));
                Object children = node.get("children");
                if (name == null || nodeType == null || !(children instanceof List<?> childNodes)) {
                    throw new SyllabusUnavailable();
                }
                SyllabusSubject subject = treeNode.subject();
                if ("SUBJECT".equals(nodeType)) {
                    subject = new SyllabusSubject(id, name);
                    if (subjects.putIfAbsent(id, subject) != null) throw new SyllabusUnavailable();
                } else if ("TOPIC".equals(nodeType) || "SUBTOPIC".equals(nodeType)) {
                    if (topics.putIfAbsent(id, new SyllabusTopic(id, name, subject)) != null) {
                        throw new SyllabusUnavailable();
                    }
                }
                for (Object child : childNodes) pending.addLast(new SyllabusTreeNode(child, subject));
            }
            return new SyllabusTaxonomy(Map.copyOf(subjects), Map.copyOf(topics));
        } catch (SyllabusUnavailable exception) {
            throw exception;
        } catch (Exception exception) {
            throw new SyllabusUnavailable();
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
            List<MarkingComponentContext> components = components(body.get("markingComponents"), totalMarks);
            List<String> criteria = components.stream().map(MarkingComponentContext::description).toList();
            TopicContext topic = topic(body.get("syllabusTopic"));
            if (prompt == null || modelAnswer == null || totalMarks == null || totalMarks.signum() <= 0 || criteria.isEmpty() || topic == null) {
                throw new QuestionUnavailable();
            }
            return new QuestionContext(prompt, modelAnswer, totalMarks, criteria, components, keywords, topic.id(), topic.code());
        } catch (HttpClientErrorException.NotFound exception) {
            // The learning service deliberately returns the same response for
            // a missing and a foreign question. Preserve that non-enumerating
            // contract at the grading boundary.
            throw new QuestionNotFound();
        } catch (HttpClientErrorException.Forbidden exception) {
            throw new Forbidden();
        } catch (Forbidden | QuestionUnavailable | QuestionNotFound exception) {
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

    /**
     * Verifies ownership before returning even an empty manual-result list.
     * Learning's owner-scoped worksheet endpoint deliberately gives the same
     * outcome for a foreign and a missing identifier.
     */
    public void assertCanManageManualResults(AuthenticatedUser user, String bearer, long worksheetId) {
        if (user == null || !"TUTOR".equals(user.role())) {
            throw new Forbidden();
        }
        try {
            Map<?, ?> worksheet = get(bearer, "/api/learning/tutor/worksheets/" + worksheetId).getBody();
            if (!sameId(worksheet, worksheetId)) {
                throw new ManualResultContextNotFound();
            }
        } catch (ManualResultContextNotFound exception) {
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

    private ResponseEntity<List> getList(String bearer, String path) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, bearer);
        return rest.exchange(base + path, HttpMethod.GET, new HttpEntity<>(headers), List.class);
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

    private static long positiveId(Object value) {
        if (!(value instanceof Number number) || number.longValue() <= 0) throw new SyllabusUnavailable();
        return number.longValue();
    }

    private static long positiveSubmissionContextId(Object value) {
        if (!(value instanceof Number number) || number.longValue() <= 0) throw new SubmissionMarkingContextUnavailable();
        return number.longValue();
    }

    private static String requiredSubmissionContextText(Object value) {
        String result = text(value);
        if (result == null) throw new SubmissionMarkingContextUnavailable();
        return result;
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

    private static List<MarkingComponentContext> components(Object value, BigDecimal questionTotal) {
        if (!(value instanceof List<?> values) || questionTotal == null) return List.of();
        List<MarkingComponentContext> components = new java.util.ArrayList<>();
        java.util.Set<Integer> positions = new java.util.HashSet<>();
        BigDecimal allocated = BigDecimal.ZERO;
        for (Object valueItem : values) {
            if (!(valueItem instanceof Map<?, ?> component)) return List.of();
            Object positionValue = component.get("position");
            String description = text(component.get("description"));
            BigDecimal marks = decimal(component.get("marks"));
            List<String> keywords = strings(component.get("keywords"));
            if (!(positionValue instanceof Number position) || position.intValue() < 0 || description == null
                || marks == null || marks.signum() <= 0 || marks.scale() > 2 || !positions.add(position.intValue())) {
                return List.of();
            }
            allocated = allocated.add(marks);
            components.add(new MarkingComponentContext(position.intValue(), description, marks, keywords));
        }
        if (allocated.compareTo(questionTotal) != 0) return List.of();
        return components.stream().sorted(java.util.Comparator.comparingInt(MarkingComponentContext::position)).toList();
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
        List<MarkingComponentContext> markingComponents,
        List<String> keywords,
        Long syllabusTopicId,
        String syllabusTopicCode
    ) { }
    public record SubmissionMarkingContext(long tutorUserId, Map<Long, QuestionContext> questionsByQuestionBankId) { }

    public record MarkingComponentContext(int position, String description, BigDecimal marks, List<String> keywords) {
        public RuleBasedAnswerChecker.WeightedMarkingComponent toRuleComponent() {
            return new RuleBasedAnswerChecker.WeightedMarkingComponent(position, description, marks, keywords);
        }
    }

    private record TopicContext(long id, String code) { }
    private record SyllabusTreeNode(Object value, SyllabusSubject subject) { }

    public record SyllabusTaxonomy(Map<Long, SyllabusSubject> subjects, Map<Long, SyllabusTopic> topics) { }
    public record SyllabusSubject(long id, String name) { }
    public record SyllabusTopic(long id, String name, SyllabusSubject subject) { }

    public static class Forbidden extends RuntimeException { }
    public static class QuestionUnavailable extends RuntimeException { }
    public static class QuestionNotFound extends RuntimeException { }
    public static class ManualResultContextNotFound extends RuntimeException { }
    public static class SubmissionMarkingContextNotFound extends RuntimeException { }
    public static class SubmissionMarkingContextUnavailable extends RuntimeException { }
    public static class MistakeHistoryNotFound extends RuntimeException { }
    public static class StudentWorksheetNotFound extends RuntimeException { }
    public static class SyllabusUnavailable extends RuntimeException { }
    public static class LearningSyncUnavailable extends RuntimeException {
        public LearningSyncUnavailable(String message) { super(message); }
    }
}
