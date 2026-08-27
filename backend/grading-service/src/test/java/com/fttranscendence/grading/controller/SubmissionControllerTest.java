package com.fttranscendence.grading.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Keeps the retired prototype controller from being reintroduced as an API. */
class SubmissionControllerTest {
    @Test
    void prototypeControllerNoLongerExposesHardCodedMarkingBehavior() {
        assertTrue(SubmissionController.class.isAnnotationPresent(Deprecated.class));
    }
}
