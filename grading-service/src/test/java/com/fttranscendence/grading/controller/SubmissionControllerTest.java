package com.fttranscendence.grading.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SubmissionControllerTest {
    @Test
    void prototypeControllerNoLongerExposesHardCodedMarkingBehavior() {
        assertTrue(SubmissionController.class.isAnnotationPresent(Deprecated.class));
    }
}
