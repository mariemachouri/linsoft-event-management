package com.eventmgmt.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserMessage {
    private String userId;
    private String keycloakId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String action;
    private Instant timestamp;
}
