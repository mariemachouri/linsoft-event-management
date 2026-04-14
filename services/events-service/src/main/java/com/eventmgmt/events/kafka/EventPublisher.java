package com.eventmgmt.events.kafka;

import com.eventmgmt.events.model.Event;
import io.smallrye.reactive.messaging.kafka.Record;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.jboss.logging.Logger;

/**
 * Service responsible for publishing event-related messages to Kafka topics
 */
@ApplicationScoped
public class EventPublisher {
    private static final Logger LOG = Logger.getLogger(EventPublisher.class);

    @Channel("event-created")
    Emitter<Record<String, EventMessage>> eventCreatedEmitter;

    @Channel("event-updated")
    Emitter<Record<String, EventMessage>> eventUpdatedEmitter;

    @Channel("event-deleted")
    Emitter<Record<String, EventMessage>> eventDeletedEmitter;

    /**
     * Publish event creation message
     */
    public void publishEventCreated(Event event) {
        try {
            EventMessage message = EventMessage.fromEvent(event, "CREATED");
            eventCreatedEmitter.send(Record.of(event.id.toString(), message));
            LOG.infof("Published event-created message for event: %s", event.id);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing event-created message for event: %s", event.id);
        }
    }

    /**
     * Publish event update message
     */
    public void publishEventUpdated(Event event) {
        try {
            EventMessage message = EventMessage.fromEvent(event, "UPDATED");
            eventUpdatedEmitter.send(Record.of(event.id.toString(), message));
            LOG.infof("Published event-updated message for event: %s", event.id);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing event-updated message for event: %s", event.id);
        }
    }

    /**
     * Publish event deletion message
     */
    public void publishEventDeleted(String eventId, Event event) {
        try {
            EventMessage message = EventMessage.fromEvent(event, "DELETED");
            eventDeletedEmitter.send(Record.of(eventId, message));
            LOG.infof("Published event-deleted message for event: %s", eventId);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing event-deleted message for event: %s", eventId);
        }
    }
}
