package com.fttranscendence.grading.model;

import java.util.Locale;

/**
 * Controlled categories used for tutor-approved learning history.
 *
 * <p>The AI error category on {@link Submission} remains a free-form advisory
 * value for backwards compatibility.  Persisted {@link MistakeRecord}s use
 * this enum so analytics cannot be fragmented by spelling variations.</p>
 */
public enum MistakeType {
    CONCEPT_MISUNDERSTANDING("Concept misunderstanding"),
    CALCULATION_ERROR("Calculation error"),
    MISREAD_QUESTION("Misread question"),
    INCOMPLETE_WORKING("Incomplete working"),
    INCORRECT_FORMULA("Incorrect formula"),
    CARELESS_MISTAKE("Careless mistake"),
    WEAK_EXPLANATION("Weak explanation"),
    MISSING_KEY_POINT("Missing key point"),
    WRONG_UNITS("Wrong units"),
    ANSWER_FORMAT_ISSUE("Answer format issue");

    private final String label;

    MistakeType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static MistakeType fromLabel(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Mistake type is required");
        }
        String normalized = value.trim();
        for (MistakeType type : values()) {
            if (type.label.equalsIgnoreCase(normalized)
                || type.name().equalsIgnoreCase(normalized)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unsupported mistake type: " + value);
    }

    public String code() {
        return name().toLowerCase(Locale.ROOT);
    }
}
