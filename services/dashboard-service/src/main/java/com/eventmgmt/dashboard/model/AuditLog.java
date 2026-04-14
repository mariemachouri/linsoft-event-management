package com.eventmgmt.dashboard.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;

/**
 * Audit log model for tracking all business events in the system
 * This provides a complete audit trail for compliance and debugging
 */
@Data
@EqualsAndHashCode(callSuper = true)
@MongoEntity(collection = "audit_logs")
public class AuditLog extends PanacheMongoEntity {
    
    // Event metadata
    private String eventType;      // event, registration, user
    private String action;          // CREATED, UPDATED, DELETED, CONFIRMED, CANCELLED
    private String entityId;        // The ID of the entity (event ID, user ID, etc.)
    private Instant timestamp;
    
    // Event details (stored as JSON for flexibility)
    private String payload;         // Full message as JSON string
    
    // Additional context
    private String topic;           // Kafka topic name
    private String userId;          // User who triggered the action (if available)
    
    // Indexing help
    private Instant createdAt;
    
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
