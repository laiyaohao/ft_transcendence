package com.fttranscendence.grading.service;

import java.math.BigDecimal;
import java.util.List;

/**
 * The reproducible outcome of checking an answer against a keyword rubric.
 *
 * <p>The matched and missing lists are intentionally returned with the result
 * so callers can show the exact basis for an automatic score.</p>
 */
public record RuleCheckResult(
    BigDecimal awardedMarks,
    BigDecimal maximumMarks,
    List<String> matchedKeywords,
    List<String> missingKeywords,
    String explanation
) {
    public RuleCheckResult {
        matchedKeywords = List.copyOf(matchedKeywords);
        missingKeywords = List.copyOf(missingKeywords);
    }
}
