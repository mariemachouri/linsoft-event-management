package com.eventmgmt.notifications.kafka;

import com.eventmgmt.notifications.dto.EventMessage;
import com.eventmgmt.notifications.dto.RegistrationMessage;
import com.eventmgmt.notifications.dto.UserMessage;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

/**
 * Kafka consumer for handling events and sending notifications
 */
@ApplicationScoped
public class NotificationConsumer {
    private static final Logger LOG = Logger.getLogger(NotificationConsumer.class);

    /**
     * Listen to event creation messages and send notifications
     */
    @Incoming("event-created")
    public void onEventCreated(EventMessage message) {
        try {
            LOG.infof("Received event-created message: %s - %s", message.getEventId(), message.getTitle());
            
            // TODO: Send email notification to organizer
            String notificationText = String.format(
                "Your event '%s' has been created successfully. It will start on %s at %s.",
                message.getTitle(), message.getStartAt(), message.getLocation()
            );
            
            LOG.infof("Notification would be sent: %s", notificationText);
            // emailService.send(organizerEmail, "Event Created", notificationText);
            
        } catch (Exception e) {
            LOG.errorf(e, "Error processing event-created message: %s", message.getEventId());
        }
    }

    /**
     * Listen to registration creation messages
     */
    @Incoming("registration-created")
    public void onRegistrationCreated(RegistrationMessage message) {
        try {
            LOG.infof("Received registration-created message: %s for event %s", 
                message.getRegistrationId(), message.getEventId());
            
            // TODO: Send notification to participant
            String notificationText = String.format(
                "You have successfully registered for the event. Registration ID: %s",
                message.getRegistrationId()
            );
            
            LOG.infof("Notification would be sent: %s", notificationText);
            // emailService.send(participantEmail, "Registration Confirmed", notificationText);
            
        } catch (Exception e) {
            LOG.errorf(e, "Error processing registration-created message: %s", message.getRegistrationId());
        }
    }

    /**
     * Listen to registration confirmation messages
     */
    @Incoming("registration-confirmed")
    public void onRegistrationConfirmed(RegistrationMessage message) {
        try {
            LOG.infof("Received registration-confirmed message: %s", message.getRegistrationId());
            
            // TODO: Send confirmation email
            String notificationText = "Your registration has been confirmed! See you at the event.";
            
            LOG.infof("Confirmation notification would be sent: %s", notificationText);
            // emailService.send(participantEmail, "Registration Confirmed", notificationText);
            
        } catch (Exception e) {
            LOG.errorf(e, "Error processing registration-confirmed message: %s", message.getRegistrationId());
        }
    }

    /**
     * Listen to user creation messages (welcome emails)
     */
    @Incoming("user-created")
    public void onUserCreated(UserMessage message) {
        try {
            LOG.infof("Received user-created message: %s - %s", message.getUserId(), message.getUsername());
            
            // TODO: Send welcome email
            String notificationText = String.format(
                "Welcome %s %s! Your account has been created successfully. Username: %s",
                message.getFirstName(), message.getLastName(), message.getUsername()
            );
            
            LOG.infof("Welcome email would be sent to: %s", message.getEmail());
            // emailService.send(message.getEmail(), "Welcome to Event Management", notificationText);
            
        } catch (Exception e) {
            LOG.errorf(e, "Error processing user-created message: %s", message.getUserId());
        }
    }
}
