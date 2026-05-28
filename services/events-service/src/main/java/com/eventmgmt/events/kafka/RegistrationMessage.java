package com.eventmgmt.events.kafka;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO representing a registration event received from the registrations-service via Kafka.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RegistrationMessage {
    private String registrationId;
    private String eventId;
    private String participantId;
    private String status;
    private String registeredAt;
    private String action; // CREATED, CONFIRMED, CANCELLED

    public RegistrationMessage() {}

    public String getRegistrationId() { return registrationId; }
    public void setRegistrationId(String registrationId) { this.registrationId = registrationId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getParticipantId() { return participantId; }
    public void setParticipantId(String participantId) { this.participantId = participantId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(String registeredAt) { this.registeredAt = registeredAt; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}
