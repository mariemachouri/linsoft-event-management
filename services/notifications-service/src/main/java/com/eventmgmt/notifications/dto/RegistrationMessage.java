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
}
