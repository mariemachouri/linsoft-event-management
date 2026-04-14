package com.eventmgmt.registrations.kafka;

import com.eventmgmt.registrations.model.Registration;
import io.smallrye.reactive.messaging.kafka.Record;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.jboss.logging.Logger;

/**
 * Service responsible for publishing registration-related messages to Kafka topics
 */
@ApplicationScoped
public class RegistrationPublisher {
    private static final Logger LOG = Logger.getLogger(RegistrationPublisher.class);

    @Channel("registration-created")
    Emitter<Record<String, RegistrationMessage>> registrationCreatedEmitter;

    @Channel("registration-confirmed")
    Emitter<Record<String, RegistrationMessage>> registrationConfirmedEmitter;

    @Channel("registration-cancelled")
    Emitter<Record<String, RegistrationMessage>> registrationCancelledEmitter;

    /**
     * Publish registration creation message
     */
    public void publishRegistrationCreated(Registration registration) {
        try {
            RegistrationMessage message = RegistrationMessage.fromRegistration(registration, "CREATED");
            registrationCreatedEmitter.send(Record.of(registration.id.toString(), message));
            LOG.infof("Published registration-created message for registration: %s", registration.id);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing registration-created message for registration: %s", registration.id);
        }
    }

    /**
     * Publish registration confirmation message
     */
    public void publishRegistrationConfirmed(Registration registration) {
        try {
            RegistrationMessage message = RegistrationMessage.fromRegistration(registration, "CONFIRMED");
            registrationConfirmedEmitter.send(Record.of(registration.id.toString(), message));
            LOG.infof("Published registration-confirmed message for registration: %s", registration.id);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing registration-confirmed message for registration: %s", registration.id);
        }
    }

    /**
     * Publish registration cancellation message
     */
    public void publishRegistrationCancelled(Registration registration) {
        try {
            RegistrationMessage message = RegistrationMessage.fromRegistration(registration, "CANCELLED");
            registrationCancelledEmitter.send(Record.of(registration.id.toString(), message));
            LOG.infof("Published registration-cancelled message for registration: %s", registration.id);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing registration-cancelled message for registration: %s", registration.id);
        }
    }
}
