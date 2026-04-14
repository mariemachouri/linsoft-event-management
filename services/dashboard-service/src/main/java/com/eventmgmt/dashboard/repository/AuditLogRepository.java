package com.eventmgmt.dashboard.repository;

import com.eventmgmt.dashboard.model.AuditLog;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.List;

/**
 * Repository for audit logs
 */
@ApplicationScoped
public class AuditLogRepository implements PanacheMongoRepository<AuditLog> {
    
    /**
     * Find audit logs by event type
     */
    public List<AuditLog> findByEventType(String eventType) {
        return list("eventType", eventType);
    }
    
    /**
     * Find audit logs by entity ID
     */
    public List<AuditLog> findByEntityId(String entityId) {
        return list("entityId", entityId);
    }
    
    /**
     * Find audit logs within a time range
     */
    public List<AuditLog> findByTimeRange(Instant start, Instant end) {
        return list("timestamp >= ?1 and timestamp <= ?2", start, end);
    }
    
    /**
     * Find recent audit logs (last N entries)
     */
    public List<AuditLog> findRecent(int limit) {
        return find("order by createdAt desc").page(0, limit).list();
    }
}
