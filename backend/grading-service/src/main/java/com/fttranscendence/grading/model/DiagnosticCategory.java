package com.fttranscendence.grading.model;

/**
 * Tutor-confirmed diagnostic categories that may be shared with Learning.
 *
 * <p>These values deliberately do not mirror the free-form advisory category
 * returned by an AI provider.  A tutor must explicitly select one of these
 * bounded categories before it becomes learning evidence.</p>
 */
public enum DiagnosticCategory {
    CONCEPT,
    KEYWORD,
    EXPRESSION,
    APPLICATION
}
