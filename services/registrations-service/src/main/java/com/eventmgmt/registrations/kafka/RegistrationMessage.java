package com.eventmgmt.registrations.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for Registration messages sent to Kafka
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationMessage {
    private String registrationId;
    private String eventId;
    private String participantId;
    private String status;
    private String registeredAt;
    private String action; // CREATED, CONFIRMED, CANCELLED
    private Instant timestamp;

    // Guest fields
    private Boolean isGuest;
    private String guestFirstName;
    private String guestLastName;
    private String guestEmail;
    private String guestPhone;

    // Authenticated participant contact
    private String participantEmail;
    private String participantPhone;
    private String participantName;

    public static RegistrationMessage fromRegistration(
            com.eventmgmt.registrations.model.Registration registration,
            String action) {
        RegistrationMessage message = new RegistrationMessage();
        message.setRegistrationId(registration.id.toString());
        message.setEventId(registration.eventId);
        message.setParticipantId(registration.participantId);
        message.setStatus(registration.status);
        message.setRegisteredAt(registration.registeredAt);
        message.setAction(action);
        message.setTimestamp(Instant.now());
        message.setIsGuest(registration.isGuest != null && registration.isGuest);
        message.setGuestFirstName(registration.guestFirstName);
        message.setGuestLastName(registration.guestLastName);
        message.setGuestEmail(registration.guestEmail);
        message.setGuestPhone(registration.guestPhone);
        message.setParticipantEmail(registration.participantEmail);
        message.setParticipantPhone(registration.participantPhone);
        message.setParticipantName(registration.participantName);
        return message;
    }
}
