package com.eventmgmt.users.kafka;

import com.eventmgmt.users.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for User messages sent to Kafka
 */
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
    private String phoneNumber;
    private Set<UserRole> roles;
    private Boolean enabled;
    private String action; // CREATED, UPDATED, DELETED
    private Instant timestamp;

    public static UserMessage fromUserProfile(
            com.eventmgmt.users.model.UserProfile user, 
            String action) {
        UserMessage message = new UserMessage();
        message.setUserId(user.id != null ? user.id.toString() : null);
        message.setKeycloakId(user.getKeycloakId());
        message.setUsername(user.getUsername());
        message.setEmail(user.getEmail());
        message.setFirstName(user.getFirstName());
        message.setLastName(user.getLastName());
        message.setPhoneNumber(user.getPhoneNumber());
        message.setRoles(user.getRoles());
        message.setEnabled(user.getEnabled());
        message.setAction(action);
        message.setTimestamp(Instant.now());
        return message;
    }
}
