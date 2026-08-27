package com.fttranscendence.learning.mastery;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Pure, deterministic mastery formula.
 *
 * <p>Each approved result contributes {@code (awarded / available) * 100},
 * treated as zero when the same marked mistake is repeated. The
 * stored score is the arithmetic mean of that adjusted result and all prior
 * approved attempts for the topic. Values are rounded half-up to two decimal
 * places. Missing score data produces no calculation.</p>
 */
@Component
public final class MasteryCalculator {
    private static final BigDecimal HUNDRED = new BigDecimal("100.00");

    public Optional<Result> calculate(
        BigDecimal previousScore,
        int priorApprovedAttempts,
        BigDecimal awardedMarks,
        BigDecimal availableMarks,
        int repeatedMistakeCount
    ) {
        if (previousScore == null || awardedMarks == null || availableMarks == null) return Optional.empty();
        if (priorApprovedAttempts < 0 || repeatedMistakeCount < 0 || availableMarks.signum() <= 0
            || awardedMarks.signum() < 0 || awardedMarks.compareTo(availableMarks) > 0
            || previousScore.signum() < 0 || previousScore.compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException("Mastery calculation inputs are invalid");
        }
        BigDecimal resultPercent = repeatedMistakeCount > 0 ? BigDecimal.ZERO
            : awardedMarks.multiply(HUNDRED).divide(availableMarks, 6, RoundingMode.HALF_UP);
        BigDecimal total = previousScore.multiply(BigDecimal.valueOf(priorApprovedAttempts)).add(resultPercent);
        BigDecimal score = total.divide(BigDecimal.valueOf(priorApprovedAttempts + 1), 2, RoundingMode.HALF_UP);
        return Optional.of(new Result(score, resultPercent.setScale(2, RoundingMode.HALF_UP)));
    }

    public record Result(BigDecimal score, BigDecimal adjustedAttemptPercent) { }
}
