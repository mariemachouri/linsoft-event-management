package com.eventmgmt.dashboard.kafka;

import com.eventmgmt.dashboard.dto.EventMessage;
import com.eventmgmt.dashboard.dto.RegistrationMessage;
import com.eventmgmt.dashboard.dto.UserMessage;
import com.eventmgmt.dashboard.service.AuditLogService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

/**
 * Kafka consumer dedicated to auditing all business events
 * This consumer records every event to MongoDB for:
 * - Compliance and regulatory requirements
 * - Debugging and troubleshooting
 * - Business analytics and reporting
 * - Historical data analysis
 */
@ApplicationScoped
public class AuditConsumer {
    private static final Logger LOG = Logger.getLogger(AuditConsumer.class);
    
    @Inject
    AuditLogService auditLogService;
    
    // ========== EVENT AUDITING ==========
    
    @Incoming("event-created")
    public void auditEventCreated(EventMessage message) {
        auditLogService.createAuditLog(
            "EVENT",
            message.getAction(),
            message.getEventId(),
            message,
            "event.created",
            message.getTimestamp()
        );
        LOG.debugf("Audited: Event created - %s", message.getEventId());
    }
    
    @Incoming("event-updated")
    public void auditEventUpdated(EventMessage message) {
        auditLogService.createAuditLog(
            "EVENT",
            message.getAction(),
            message.getEventId(),
            message,
            "event.updated",
            message.getTimestamp()
        );
        LOG.debugf("Audited: Event updated - %s", message.getEventId());
    }
    
    @Incoming("event-deleted")
    public void auditEventDeleted(EventMessage message) {
        auditLogService.createAuditLog(
            "EVENT",
            message.getAction(),
            message.getEventId(),
            message,
            "event.deleted",
            message.getTimestamp()
        );
        LOG.debugf("Audited: Event deleted - %s", message.getEventId());
    }
    
    // ========== REGISTRATION AUDITING ==========
    
    @Incoming("registration-created")
    public void auditRegistrationCreated(RegistrationMessage message) {
        auditLogService.createAuditLog(
            "REGISTRATION",
            message.getAction(),
            message.getRegistrationId(),
            message,
            "registration.created",
            message.getTimestamp()
        );
        LOG.debugf("Audited: Registration created - %s", message.getRegistrationId());
    }
    
    @Incoming("registration-cancelled")
    public void auditRegistrationCancelled(RegistrationMessage message) {
        auditLogService.createAuditLog(
            "REGISTRATION",
            message.getAction(),
            message.getRegistrationId(),
            message,
            "registration.cancelled",
            message.getTimestamp()
        );
        LOG.debugf("Audited: Registration cancelled - %s", message.getRegistrationId());
    }
    
    @Incoming("registration-confirmed")
    public void auditRegistrationConfirmed(RegistrationMessage message) {
        auditLogService.createAuditLog(
            "REGISTRATION",
            message.getAction(),
            message.getRegistrationId(),
            message,
            "registration.confirmed",
            message.getTimestamp()
        );
        LOG.debugf("Audited: Registration confirmed - %s", message.getRegistrationId());
    }
    
    // ========== USER AUDITING ==========
    
    @Incoming("user-updated")
    public void auditUserUpdated(UserMessage message) {
        auditLogService.createAuditLog(
            "USER",
            message.getAction(),
            message.getUserId(),
            message,
            "user.updated",
            message.getTimestamp()
        );
        LOG.debugf("Audited: User updated - %s", message.getUserId());
    }
    
    @Incoming("user-deleted")
    public void auditUserDeleted(UserMessage message) {
        auditLogService.createAuditLog(
            "USER",
            message.getAction(),
            message.getUserId(),
            message,
            "user.deleted",
            message.getTimestamp()
        );
        LOG.debugf("Audited: User deleted - %s", message.getUserId());
    }
    
    @Incoming("user-created")
    public void auditUserCreated(UserMessage message) {
        auditLogService.createAuditLog(
            "USER",
            message.getAction(),
            message.getUserId(),
            message,
            "user.created",
            message.getTimestamp()
        );
        LOG.debugf("Audited: User created - %s", message.getUserId());
    }
}
