package com.eventmgmt.notifications.kafka;

import com.eventmgmt.notifications.dto.EventMessage;
import com.eventmgmt.notifications.dto.RegistrationMessage;
import com.eventmgmt.notifications.dto.UserMessage;
import com.eventmgmt.notifications.model.Notification;
import com.eventmgmt.notifications.model.NotificationType;
import com.eventmgmt.notifications.service.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

/**
 * Kafka consumer for handling events and sending notifications.
 * Each handler persists a Notification record in MongoDB and triggers
 * the real email delivery via NotificationService → EmailSender (SMTP).
 *
 * NOTE: recipientId is expected to be a valid email address.
 * - For event/registration messages the Kafka producer must embed the
 *   organizer/participant email in the organizerId / participantId field,
 *   OR a user-lookup step must be added here to resolve the ID to an email.
 * - For user-created messages the email field is used directly.
 */
@ApplicationScoped
public class NotificationConsumer {
    private static final Logger LOG = Logger.getLogger(NotificationConsumer.class);

    @Inject
    NotificationService notificationService;

    // ---------------------------------------------------------------
    // Helpers: build and persist a Notification, then send it
    // ---------------------------------------------------------------
    private void createAndSend(String recipientEmail, String message) {
        Notification n = new Notification();
        n.recipientId = recipientEmail;
        n.type        = NotificationType.EMAIL;
        n.message     = message;
        notificationService.create(n);
    }

    private void createAndSendSms(String phoneNumber, String message) {
        if (phoneNumber == null || phoneNumber.isBlank()) return;
        Notification n = new Notification();
        n.recipientId = phoneNumber.startsWith("+") ? phoneNumber : "+" + phoneNumber;
        n.type        = NotificationType.SMS;
        n.message     = message;
        notificationService.create(n);
    }

    // ---------------------------------------------------------------
    // Event created → email to organizer
    // ---------------------------------------------------------------
    @Incoming("event-created")
    public void onEventCreated(EventMessage message) {
        try {
            LOG.infof("Received event-created: eventId=%s title='%s'",
                    message.getEventId(), message.getTitle());

            String body = String.format(
                "Bonjour,\n\n" +
                "Votre événement '%s' a été créé avec succès.\n" +
                "  • Lieu    : %s\n" +
                "  • Début   : %s\n" +
                "  • Fin     : %s\n\n" +
                "Référence : %s\n\n" +
                "Cordialement,\nL'équipe Event Management",
                message.getTitle(),
                message.getLocation(),
                message.getStartAt(),
                message.getEndAt(),
                message.getEventId()
            );

            // organizerId should be the organizer's email address
            createAndSend(message.getOrganizerId(), body);

            LOG.infof("Email notification triggered for event %s → %s",
                    message.getEventId(), message.getOrganizerId());

        } catch (Exception e) {
            LOG.errorf(e, "Error processing event-created message: %s", message.getEventId());
        }
    }

    // ---------------------------------------------------------------
    // Registration created → confirmation email to participant
    // ---------------------------------------------------------------
    @Incoming("registration-created")
    public void onRegistrationCreated(RegistrationMessage message) {
        try {
            LOG.infof("Received registration-created: registrationId=%s eventId=%s",
                    message.getRegistrationId(), message.getEventId());

            String body = String.format(
                "Bonjour,\n\n" +
                "Votre inscription a bien été enregistrée.\n" +
                "  • Numéro d'inscription : %s\n" +
                "  • Événement            : %s\n" +
                "  • Date d'inscription   : %s\n\n" +
                "Votre inscription est en attente de confirmation.\n\n" +
                "Cordialement,\nL'équipe Event Management",
                message.getRegistrationId(),
                message.getEventId(),
                message.getRegisteredAt()
            );

            // participantId should be the participant's email address
            createAndSend(message.getParticipantId(), body);

            LOG.infof("Email notification triggered for registration %s → %s",
                    message.getRegistrationId(), message.getParticipantId());

        } catch (Exception e) {
            LOG.errorf(e, "Error processing registration-created message: %s", message.getRegistrationId());
        }
    }

    // ---------------------------------------------------------------
    // Registration confirmed → confirmation email to participant
    // ---------------------------------------------------------------
    @Incoming("registration-confirmed")
    public void onRegistrationConfirmed(RegistrationMessage message) {
        try {
            LOG.infof("Received registration-confirmed: registrationId=%s",
                    message.getRegistrationId());

            String body = String.format(
                "Bonjour,\n\n" +
                "Votre inscription a été CONFIRMÉE !\n" +
                "  • Numéro d'inscription : %s\n" +
                "  • Événement            : %s\n\n" +
                "Nous avons hâte de vous voir à l'événement.\n\n" +
                "Cordialement,\nL'équipe Event Management",
                message.getRegistrationId(),
                message.getEventId()
            );

            createAndSend(message.getParticipantId(), body);

            LOG.infof("Confirmation email triggered for registration %s → %s",
                    message.getRegistrationId(), message.getParticipantId());

        } catch (Exception e) {
            LOG.errorf(e, "Error processing registration-confirmed message: %s", message.getRegistrationId());
        }
    }

    // ---------------------------------------------------------------
    // User created → welcome email (email field is directly available)
    // ---------------------------------------------------------------
    @Incoming("user-created")
    public void onUserCreated(UserMessage message) {
        try {
            LOG.infof("Received user-created: userId=%s username=%s email=%s",
                    message.getUserId(), message.getUsername(), message.getEmail());

            String body = String.format(
                "Bonjour %s %s,\n\n" +
                "Bienvenue sur la plateforme Event Management !\n" +
                "  • Nom d'utilisateur : %s\n" +
                "  • Email             : %s\n\n" +
                "Votre compte est maintenant actif. Vous pouvez dès à présent\n" +
                "vous connecter et parcourir les événements disponibles.\n\n" +
                "Cordialement,\nL'équipe Event Management",
                message.getFirstName(),
                message.getLastName(),
                message.getUsername(),
                message.getEmail()
            );

            // Send welcome email
            createAndSend(message.getEmail(), body);
            LOG.infof("Welcome email triggered for user %s → %s",
                    message.getUserId(), message.getEmail());

            // Send welcome SMS if phone number is provided
            if (message.getPhoneNumber() != null && !message.getPhoneNumber().isBlank()) {
                String smsBody = String.format(
                    "Bienvenue %s sur Event Management ! " +
                    "Votre compte @%s est actif. Bonne découverte !",
                    message.getFirstName(),
                    message.getUsername()
                );
                createAndSendSms(message.getPhoneNumber(), smsBody);
                LOG.infof("Welcome SMS triggered for user %s → %s",
                        message.getUserId(), message.getPhoneNumber());
            }

        } catch (Exception e) {
            LOG.errorf(e, "Error processing user-created message: %s", message.getUserId());
        }
    }
}
