package com.fttranscendence.grading.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * A deliberately small, deterministic keyword checker.
 *
 * <p>It does not use an AI provider or fuzzy matching.  A caller may supply
 * approved synonyms for an individual rubric target; anything not in that
 * list cannot affect a result. This makes both the score and its evidence
 * reproducible.</p>
 */
@Service
public class RuleBasedAnswerChecker {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);

    public RuleCheckResult check(String answer, List<String> rubricKeywords, BigDecimal maximumMarks) {
        return check(answer, rubricKeywords, Map.of(), maximumMarks);
    }

    public RuleCheckResult check(
        String answer,
        List<String> rubricKeywords,
        Map<String, List<String>> approvedSynonyms,
        BigDecimal maximumMarks
    ) {
        List<RubricTarget> targets = validateAndNormalizeRubric(rubricKeywords, approvedSynonyms);
        validateMaximumMarks(maximumMarks);

        String normalizedAnswer = normalize(answer);
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (RubricTarget target : targets) {
            if (target.matches(normalizedAnswer)) {
                matched.add(target.displayValue());
            } else {
                missing.add(target.displayValue());
            }
        }

        BigDecimal awarded = maximumMarks
            .multiply(BigDecimal.valueOf(matched.size()))
            .divide(BigDecimal.valueOf(targets.size()), 2, RoundingMode.HALF_UP)
            .min(maximumMarks)
            .max(BigDecimal.ZERO);

        String explanation = "Matched " + matched.size() + " of " + targets.size() + " rubric targets.";
        return new RuleCheckResult(
            awarded,
            maximumMarks,
            matched,
            missing,
            explanation
        );
    }

    private List<RubricTarget> validateAndNormalizeRubric(
        List<String> rubricKeywords,
        Map<String, List<String>> approvedSynonyms
    ) {
        if (rubricKeywords == null || rubricKeywords.isEmpty()) {
            throw new IllegalArgumentException("A rubric must contain at least one keyword.");
        }
        if (approvedSynonyms == null) {
            throw new IllegalArgumentException("Approved synonyms must not be null.");
        }

        Map<String, String> canonicalTargets = new LinkedHashMap<>();
        for (String keyword : rubricKeywords) {
            String normalized = normalize(keyword);
            if (normalized.isEmpty()) {
                throw new IllegalArgumentException("Rubric keywords must not be blank.");
            }
            if (canonicalTargets.putIfAbsent(normalized, keyword.trim()) != null) {
                throw new IllegalArgumentException("Rubric keywords must be unique.");
            }
        }

        Map<String, List<String>> normalizedSynonyms = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : approvedSynonyms.entrySet()) {
            String canonical = normalize(entry.getKey());
            if (!canonicalTargets.containsKey(canonical)) {
                throw new IllegalArgumentException("Synonyms must belong to a rubric keyword.");
            }
            if (entry.getValue() == null) {
                throw new IllegalArgumentException("A synonym list must not be null.");
            }

            List<String> aliases = new ArrayList<>();
            for (String synonym : entry.getValue()) {
                String normalized = normalize(synonym);
                if (normalized.isEmpty()) {
                    throw new IllegalArgumentException("Synonyms must not be blank.");
                }
                if (!aliases.contains(normalized)) {
                    aliases.add(normalized);
                }
            }
            normalizedSynonyms.put(canonical, aliases);
        }

        return canonicalTargets.entrySet().stream()
            .map(entry -> new RubricTarget(
                entry.getValue(),
                entry.getKey(),
                normalizedSynonyms.getOrDefault(entry.getKey(), List.of())
            ))
            .toList();
    }

    private void validateMaximumMarks(BigDecimal maximumMarks) {
        if (maximumMarks == null || maximumMarks.signum() < 0) {
            throw new IllegalArgumentException("Maximum marks must be zero or greater.");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(value, Normalizer.Form.NFKD)
            .replaceAll("\\p{M}", "");
        return decomposed
            .toLowerCase(java.util.Locale.ROOT)
            .replaceAll("[^\\p{Alnum}]+", " ")
            .trim()
            .replaceAll("\\s+", " ");
    }

    private record RubricTarget(String displayValue, String canonicalValue, List<String> synonyms) {
        private boolean matches(String normalizedAnswer) {
            return containsPhrase(normalizedAnswer, canonicalValue)
                || synonyms.stream().anyMatch(synonym -> containsPhrase(normalizedAnswer, synonym));
        }

        private static boolean containsPhrase(String normalizedAnswer, String phrase) {
            return !normalizedAnswer.isEmpty()
                && (" " + normalizedAnswer + " ").contains(" " + phrase + " ");
        }
    }
}
