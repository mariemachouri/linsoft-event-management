package com.eventmgmt.notifications.kafka;

import com.eventmgmt.notifications.dto.EventMessage;
import com.eventmgmt.notifications.dto.RegistrationMessage;
import com.eventmgmt.notifications.dto.UserMessage;
import com.eventmgmt.notifications.model.EventInfo;
import com.eventmgmt.notifications.model.EventReminder;
import com.eventmgmt.notifications.model.Notification;
import com.eventmgmt.notifications.model.NotificationType;
import com.eventmgmt.notifications.service.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

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

    // Formatteur de date FR : "2 juin 2026 à 08:54"
    private static final DateTimeFormatter FR_DATE = DateTimeFormatter
            .ofPattern("d MMMM yyyy 'à' HH:mm", Locale.FRENCH)
            .withZone(ZoneId.of("Europe/Paris"));

    private static final DateTimeFormatter FR_DATE_SHORT = DateTimeFormatter
            .ofPattern("d MMM yyyy", Locale.FRENCH)
            .withZone(ZoneId.of("Africa/Tunis"));

    /** Convertit une date ISO (Instant) en format lisible français. */
    private String formatDate(String iso) {
        if (iso == null || iso.isBlank()) return "—";
        try {
            return FR_DATE.format(Instant.parse(iso));
        } catch (Exception e) {
            return iso;
        }
    }

    private String formatDateShort(String iso) {
        if (iso == null || iso.isBlank()) return "";
        try {
            return FR_DATE_SHORT.format(Instant.parse(iso));
        } catch (Exception e) {
            return "";
        }
    }

    private String getEventLocation(String eventId) {
        try {
            EventInfo info = EventInfo.find("eventId", eventId).firstResult();
            if (info != null && info.location != null && !info.location.isBlank()) {
                return info.location;
            }
        } catch (Exception ex) { }
        return null;
    }

    private String getEventStartDate(String eventId) {
        try {
            EventInfo info = EventInfo.find("eventId", eventId).firstResult();
            if (info != null && info.startDate != null) {
                return formatDateShort(info.startDate);
            }
        } catch (Exception ex) { }
        return null;
    }

    private String buildRegistrationSms(String name, String eventId) {
        String eventTitle = getEventTitle(eventId);
        String location = getEventLocation(eventId);
        String date = getEventStartDate(eventId);

        StringBuilder sb = new StringBuilder();
        sb.append("[LinSoft Event Management]\n");
        sb.append("Bonjour");
        if (name != null && !name.isBlank()) {
            sb.append(" ").append(name.trim());
        }
        sb.append(",\n\nVotre inscription a ete confirmee !\n\n");
        sb.append("Evenement : ").append(eventTitle).append("\n");
        if (date != null && !date.isEmpty()) {
            sb.append("Date : ").append(date).append("\n");
        }
        if (location != null && !location.isEmpty()) {
            sb.append("Lieu : ").append(location).append("\n");
        }
        sb.append("\nA bientot !");
        return sb.toString();
    }

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

    /**
     * Construit la section "lien de connexion" si l'événement est en ligne.
     * Retourne "" si l'événement n'est pas en ligne / pas de lien.
     */
    private String getEventTitle(String eventId) {
        try {
            EventInfo info = EventInfo.find("eventId", eventId).firstResult();
            if (info != null && info.title != null && !info.title.isBlank()) {
                return info.title;
            }
        } catch (Exception ex) {
            LOG.warnf("getEventTitle error for %s: %s", eventId, ex.getMessage());
        }
        return eventId;
    }

    private String buildMeetingSection(String eventId) {
        try {
            EventInfo info = EventInfo.find("eventId", eventId).firstResult();
            if (info != null && Boolean.TRUE.equals(info.isOnline)
                    && info.meetingLink != null && !info.meetingLink.isBlank()) {
                return "\n🔗 Cet événement est EN LIGNE. Lien de connexion (Google Meet) :\n"
                     + "   " + info.meetingLink + "\n"
                     + "   (Connectez-vous à l'heure de l'événement avec ce lien.)\n";
            }
        } catch (Exception ex) {
            LOG.warnf("buildMeetingSection error for %s: %s", eventId, ex.getMessage());
        }
        return "";
    }

    /** Enregistre un abonnement aux rappels (dédupliqué par eventId + email). */
    private void subscribeReminder(String eventId, String email, String phone, String name, boolean guest) {
        if (eventId == null || email == null || email.isBlank()) return;
        try {
            EventReminder existing = EventReminder
                .find("eventId = ?1 and email = ?2", eventId, email).firstResult();
            if (existing != null) return; // déjà abonné
            EventReminder r = new EventReminder();
            r.eventId = eventId;
            r.email   = email;
            r.phone   = phone;
            r.name    = name;
            r.guest   = guest;
            r.persist();
            LOG.infof("Reminder subscription created: event=%s → %s", eventId, email);
        } catch (Exception ex) {
            LOG.warnf("Could not create reminder subscription for %s: %s", email, ex.getMessage());
        }
    }

    // ---------------------------------------------------------------
    // Event created → email to organizer
    // ---------------------------------------------------------------
    @Incoming("event-created")
    public void onEventCreated(EventMessage message) {
        try {
            LOG.infof("Received event-created: eventId=%s title='%s'",
                    message.getEventId(), message.getTitle());

            // Met en cache les infos de l'événement (pour les rappels J-X)
            try {
                EventInfo info = EventInfo.find("eventId", message.getEventId()).firstResult();
                if (info == null) {
                    info = new EventInfo();
                    info.eventId = message.getEventId();
                }
                info.title = message.getTitle();
                info.location = message.getLocation();
                info.startDate = message.getStartAt();
                info.isOnline = Boolean.TRUE.equals(message.getIsOnline());
                info.meetingLink = message.getMeetingLink();
                info.persistOrUpdate();
            } catch (Exception ex) {
                LOG.warnf("Could not cache EventInfo for %s: %s", message.getEventId(), ex.getMessage());
            }

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
    // Registration created → confirmation email (+ SMS) to participant
    // ---------------------------------------------------------------
    @Incoming("registration-created")
    public void onRegistrationCreated(RegistrationMessage message) {
        try {
            LOG.infof("Received registration-created: registrationId=%s eventId=%s isGuest=%s",
                    message.getRegistrationId(), message.getEventId(), message.getIsGuest());

            if (message.isGuestRegistration()) {
                // ── Guest registration ──
                String firstName = message.getGuestFirstName() != null ? message.getGuestFirstName() : "";
                String lastName  = message.getGuestLastName()  != null ? message.getGuestLastName()  : "";
                String email     = message.getGuestEmail();
                String phone     = message.getGuestPhone();

                if (email == null || email.isBlank()) {
                    LOG.warnf("Guest registration %s has no email — skipping email notification",
                            message.getRegistrationId());
                    return;
                }

                String eventTitle = getEventTitle(message.getEventId());
                String emailBody = String.format(
                    "Bonjour %s %s,\n\n" +
                    "Votre inscription en tant que visiteur a bien été enregistrée !\n\n" +
                    "  • Événement          : %s\n" +
                    "  • Date d'inscription : %s\n" +
                    "%s\n" +
                    "Vous recevrez des notifications sur cet email et votre numéro de téléphone\n" +
                    "pour toutes les mises à jour concernant l'événement.\n\n" +
                    "Cordialement,\nL'équipe Event Management",
                    firstName, lastName,
                    eventTitle,
                    formatDate(message.getRegisteredAt()),
                    buildMeetingSection(message.getEventId())
                );

                createAndSend(email, emailBody);
                LOG.infof("Guest email notification sent for registration %s → %s",
                        message.getRegistrationId(), email);

                // Also send SMS to guest phone
                if (phone != null && !phone.isBlank()) {
                    String smsBody = buildRegistrationSms(firstName, message.getEventId());
                    createAndSendSms(phone, smsBody);
                    LOG.infof("Guest SMS notification sent for registration %s → %s",
                            message.getRegistrationId(), phone);
                }

                // Abonnement aux rappels J-10/5/3/2/1/0
                subscribeReminder(message.getEventId(), email, phone,
                        (firstName + " " + lastName).trim(), true);

            } else {
                // ── Authenticated participant ──
                String email = message.getParticipantEmail();
                String phone = message.getParticipantPhone();
                String name  = message.getParticipantName();

                String eventTitle2 = getEventTitle(message.getEventId());
                String body = String.format(
                    "Bonjour %s,\n\n" +
                    "Votre inscription a bien été enregistrée.\n\n" +
                    "  • Événement          : %s\n" +
                    "  • Date d'inscription : %s\n" +
                    "%s\n" +
                    "Vous recevrez des rappels avant l'événement.\n\n" +
                    "Cordialement,\nL'équipe Event Management",
                    (name != null && !name.isBlank()) ? name : "",
                    eventTitle2,
                    formatDate(message.getRegisteredAt()),
                    buildMeetingSection(message.getEventId())
                );

                // Utilise l'email du participant (fallback : participantId pour rétro-compat)
                String recipient = (email != null && !email.isBlank()) ? email : message.getParticipantId();
                if (recipient != null && recipient.contains("@")) {
                    createAndSend(recipient, body);
                    LOG.infof("Email notification sent for registration %s → %s",
                            message.getRegistrationId(), recipient);
                    // SMS éventuel
                    if (phone != null && !phone.isBlank()) {
                        createAndSendSms(phone, buildRegistrationSms(name, message.getEventId()));
                    }
                    // Abonnement aux rappels
                    subscribeReminder(message.getEventId(), recipient, phone, name, false);
                } else {
                    LOG.warnf("Registration %s : pas d'email participant valide (recipient=%s) — email/rappels ignorés",
                            message.getRegistrationId(), recipient);
                }
            }

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
                "Votre inscription a été CONFIRMÉE !\n\n" +
                "  • Événement : %s\n\n" +
                "Nous avons hâte de vous voir à l'événement.\n\n" +
                "Cordialement,\nL'équipe Event Management",
                getEventTitle(message.getEventId())
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
