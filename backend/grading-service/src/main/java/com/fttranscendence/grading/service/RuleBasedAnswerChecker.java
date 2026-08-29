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
import java.util.Set;

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
            explanation,
            List.of()
        );
    }

    /**
     * Scores explicit marking components before any unweighted keyword
     * fallback. Component marks are authoritative allocations: their total
     * must exactly equal the question maximum, so no suggestion can silently
     * award more than the question permits.
     *
     * <p>The current question-bank contract stores a component description
     * rather than a free-form AI rule. We therefore perform only exact,
     * normalized phrase matching against that description and its stable
     * action-verb-free form (for example, "Explains heat conduction" also
     * accepts "heat conduction"). This remains reproducible and deliberately
     * avoids fuzzy or generative interpretation.</p>
     */
    public RuleCheckResult checkWeighted(
        String answer,
        List<WeightedMarkingComponent> components,
        BigDecimal maximumMarks
    ) {
        validateMaximumMarks(maximumMarks);
        List<WeightedMarkingComponent> validated = validateComponents(components, maximumMarks);
        String normalizedAnswer = normalize(answer);
        BigDecimal awarded = ZERO;
        List<RuleCheckResult.ComponentResult> results = new ArrayList<>();
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (WeightedMarkingComponent component : validated) {
            List<String> targets = componentTargets(component.description());
            boolean componentMatched = targets.stream().anyMatch(target -> containsPhrase(normalizedAnswer, target));
            if (componentMatched) {
                awarded = awarded.add(component.marks());
                matched.add(component.description());
            } else {
                missing.add(component.description());
            }
            results.add(new RuleCheckResult.ComponentResult(
                component.position(), component.description(), component.marks(), componentMatched,
                componentMatched ? targets : List.of(), componentMatched ? List.of() : targets,
                componentMatched ? "Matched deterministic component target." : "No deterministic component target was found."
            ));
        }
        awarded = awarded.setScale(2, RoundingMode.HALF_UP).min(maximumMarks).max(BigDecimal.ZERO);
        String explanation = "Matched " + matched.size() + " of " + validated.size() + " weighted marking components.";
        return new RuleCheckResult(awarded, maximumMarks, matched, missing, explanation, results);
    }

    private List<WeightedMarkingComponent> validateComponents(
        List<WeightedMarkingComponent> components, BigDecimal maximumMarks
    ) {
        if (components == null || components.isEmpty()) {
            throw new IllegalArgumentException("At least one weighted marking component is required.");
        }
        List<WeightedMarkingComponent> normalized = new ArrayList<>();
        Set<Integer> positions = new java.util.HashSet<>();
        BigDecimal allocated = BigDecimal.ZERO;
        for (WeightedMarkingComponent component : components) {
            if (component == null || component.position() < 0 || component.description() == null
                || component.description().isBlank() || component.marks() == null || component.marks().signum() <= 0) {
                throw new IllegalArgumentException("Each weighted marking component needs a position, description, and positive marks.");
            }
            if (!positions.add(component.position())) {
                throw new IllegalArgumentException("Weighted marking component positions must be unique.");
            }
            if (component.marks().scale() > 2) {
                throw new IllegalArgumentException("Weighted marking component marks may have at most two decimal places.");
            }
            allocated = allocated.add(component.marks());
            normalized.add(new WeightedMarkingComponent(component.position(), component.description().trim(), component.marks()));
        }
        if (allocated.compareTo(maximumMarks) > 0) {
            throw new IllegalArgumentException("Weighted marking component marks cannot exceed the question total.");
        }
        if (allocated.compareTo(maximumMarks) != 0) {
            throw new IllegalArgumentException("Weighted marking component marks must exactly equal the question total.");
        }
        return normalized.stream().sorted(java.util.Comparator.comparingInt(WeightedMarkingComponent::position)).toList();
    }

    private List<String> componentTargets(String description) {
        String normalized = normalize(description);
        if (normalized.isEmpty()) return List.of();
        String withoutLeadingVerb = normalized.replaceFirst(
            "^(explains|explain|states|state|identifies|identify|calculates|calculate|uses|use|shows|show|describes|describe|mentions|mention) ", ""
        );
        if (withoutLeadingVerb.equals(normalized)) return List.of(normalized);
        return List.of(normalized, withoutLeadingVerb);
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
            return RuleBasedAnswerChecker.containsPhrase(normalizedAnswer, phrase);
        }
    }

    private static boolean containsPhrase(String normalizedAnswer, String phrase) {
        return !normalizedAnswer.isEmpty() && !phrase.isEmpty()
            && (" " + normalizedAnswer + " ").contains(" " + phrase + " ");
    }

    /** A server-supplied mark allocation, never trusted from a browser request. */
    public record WeightedMarkingComponent(int position, String description, BigDecimal marks) { }
}
