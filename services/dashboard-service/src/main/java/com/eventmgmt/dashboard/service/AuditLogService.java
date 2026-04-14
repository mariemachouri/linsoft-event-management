package com.eventmgmt.dashboard.service;

import com.eventmgmt.dashboard.model.AuditLog;
import com.eventmgmt.dashboard.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;

/**
 * Service for managing audit logs
 */
@ApplicationScoped
public class AuditLogService {
    private static final Logger LOG = Logger.getLogger(AuditLogService.class);
    
    @Inject
    AuditLogRepository repository;
    
    @Inject
    ObjectMapper objectMapper;
    
    /**
     * Create an audit log entry
     */
    public void createAuditLog(String eventType, String action, String entityId, 
                               Object messagePayload, String topic, Instant timestamp) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setEventType(eventType);
            auditLog.setAction(action);
            auditLog.setEntityId(entityId);
            auditLog.setTopic(topic);
            auditLog.setTimestamp(timestamp != null ? timestamp : Instant.now());
            
            // Convert payload to JSON string
            if (messagePayload != null) {
                auditLog.setPayload(objectMapper.writeValueAsString(messagePayload));
            }
            
            auditLog.prePersist();
            repository.persist(auditLog);
            
            LOG.debugf("Created audit log: %s - %s - %s", eventType, action, entityId);
        } catch (Exception e) {
            LOG.errorf(e, "Error creating audit log: %s", entityId);
        }
    }
}
