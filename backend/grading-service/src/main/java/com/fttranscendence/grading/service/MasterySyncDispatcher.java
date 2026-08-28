package com.fttranscendence.grading.service;

import com.fttranscendence.grading.model.MasterySyncOutbox;
import com.fttranscendence.grading.repository.MasterySyncOutboxRepository;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/** Retries only durable outbox records; failed remote calls never discard tutor approval. */
@Service
public class MasterySyncDispatcher {
    private final MasterySyncOutboxRepository outbox;
    private final LearningAuthorizationClient learning;

    public MasterySyncDispatcher(MasterySyncOutboxRepository outbox, LearningAuthorizationClient learning) {
        this.outbox = outbox;
        this.learning = learning;
    }

    @Scheduled(fixedDelayString = "${learning.service.sync.retry-delay-ms:60000}")
    public void dispatchPending() {
        outbox.findTop25ByDeliveredAtIsNullOrderByIdAsc().forEach(this::dispatchOne);
    }

    @Transactional
    public void dispatchOne(MasterySyncOutbox event) {
        if (event.getDeliveredAt() != null) return;
        try {
            learning.sync(event.getEventType(), event.getPayload());
            event.delivered();
        } catch (RuntimeException exception) {
            event.failed(exception.getMessage());
        }
        outbox.saveAndFlush(event);
    }
}
