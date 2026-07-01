package com.eventmgmt.events.kafka;

import com.eventmgmt.events.service.EventService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

/**
 * Kafka consumer that listens to registration events from the registrations-service
 * and updates the currentParticipants counter on the corresponding event.
 */
@ApplicationScoped
public class RegistrationConsumer {

    private static final Logger LOG = Logger.getLogger(RegistrationConsumer.class);

    @Inject
    EventService eventService;

    @Incoming("registration-created-in")
    public void onRegistrationCreated(RegistrationMessage message) {
        if (message == null || message.getEventId() == null) {
            LOG.warn("Received null or incomplete registration-created message, skipping");
            return;
        }
        // Participant count is updated synchronously via REST by registrations-service.
        // Kafka message received for observability only.
        LOG.infof("registration-created received for eventId=%s (count already updated via REST)",
                message.getEventId());
    }

    @Incoming("registration-cancelled-in")
    public void onRegistrationCancelled(RegistrationMessage message) {
        if (message == null || message.getEventId() == null) {
            LOG.warn("Received null or incomplete registration-cancelled message, skipping");
            return;
        }
        // Participant count is decremented synchronously via REST by registrations-service.
        LOG.infof("registration-cancelled received for eventId=%s (count already updated via REST)",
                message.getEventId());
    }
}
