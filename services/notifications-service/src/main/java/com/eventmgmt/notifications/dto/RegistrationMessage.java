package com.eventmgmt.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationMessage {
    private String registrationId;
    private String eventId;
    private String participantId;
    private String status;
    private String registeredAt;
    private String action;
    private Instant timestamp;

    // Guest registration fields
    private Boolean isGuest;
    private String guestFirstName;
    private String guestLastName;
    private String guestEmail;
    private String guestPhone;

    // Authenticated participant contact (pour confirmation + rappels)
    private String participantEmail;
    private String participantPhone;
    private String participantName;

    public boolean isGuestRegistration() {
        return Boolean.TRUE.equals(isGuest);
    }
}
