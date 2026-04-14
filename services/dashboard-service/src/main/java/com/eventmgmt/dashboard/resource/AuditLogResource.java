package com.eventmgmt.dashboard.resource;

import com.eventmgmt.dashboard.model.AuditLog;
import com.eventmgmt.dashboard.repository.AuditLogRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * REST API for querying audit logs
 */
@Path("/api/audit")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Audit Logs", description = "Endpoints for querying audit trail")
public class AuditLogResource {
    
    @Inject
    AuditLogRepository repository;
    
    /**
     * Get all audit logs (paginated)
     */
    @GET
    @Operation(summary = "Get all audit logs", description = "Retrieve all audit logs with optional pagination")
    public Response getAllAuditLogs(
            @QueryParam("limit") @DefaultValue("100") @Parameter(description = "Maximum number of results") int limit,
            @QueryParam("offset") @DefaultValue("0") @Parameter(description = "Offset for pagination") int offset) {
        
        List<AuditLog> logs = AuditLog.findAll()
            .page(offset / limit, limit)
            .list();
        
        long total = AuditLog.count();
        
        return Response.ok()
            .entity(logs)
            .header("X-Total-Count", total)
            .build();
    }
    
    /**
     * Get recent audit logs
     */
    @GET
    @Path("/recent")
    @Operation(summary = "Get recent audit logs", description = "Get the most recent audit logs")
    public List<AuditLog> getRecentAuditLogs(
            @QueryParam("limit") @DefaultValue("50") @Parameter(description = "Number of recent logs") int limit) {
        return repository.findRecent(limit);
    }
    
    /**
     * Get audit logs by event type
     */
    @GET
    @Path("/type/{eventType}")
    @Operation(summary = "Get logs by event type", description = "Filter audit logs by event type (EVENT, REGISTRATION, USER)")
    public List<AuditLog> getAuditLogsByType(
            @PathParam("eventType") @Parameter(description = "Event type: EVENT, REGISTRATION, USER") String eventType) {
        return repository.findByEventType(eventType.toUpperCase());
    }
    
    /**
     * Get audit logs by entity ID
     */
    @GET
    @Path("/entity/{entityId}")
    @Operation(summary = "Get logs for specific entity", description = "Get audit trail for a specific entity (event, registration, user)")
    public List<AuditLog> getAuditLogsByEntity(
            @PathParam("entityId") @Parameter(description = "Entity ID") String entityId) {
        return repository.findByEntityId(entityId);
    }
    
    /**
     * Get audit logs by time range
     */
    @GET
    @Path("/timerange")
    @Operation(summary = "Get logs by time range", description = "Filter audit logs by time period")
    public List<AuditLog> getAuditLogsByTimeRange(
            @QueryParam("start") @Parameter(description = "Start timestamp (ISO-8601)") String start,
            @QueryParam("end") @Parameter(description = "End timestamp (ISO-8601)") String end) {
        
        Instant startTime = start != null ? Instant.parse(start) : Instant.now().minus(24, ChronoUnit.HOURS);
        Instant endTime = end != null ? Instant.parse(end) : Instant.now();
        
        return repository.findByTimeRange(startTime, endTime);
    }
    
    /**
     * Get audit logs statistics
     */
    @GET
    @Path("/stats")
    @Operation(summary = "Get audit statistics", description = "Get aggregated statistics about audit logs")
    public Response getAuditStats() {
        long totalEvents = repository.count("eventType", "EVENT");
        long totalRegistrations = repository.count("eventType", "REGISTRATION");
        long totalUsers = repository.count("eventType", "USER");
        long totalAudits = repository.count();
        
        var stats = new AuditStats(totalAudits, totalEvents, totalRegistrations, totalUsers);
        
        return Response.ok(stats).build();
    }
    
    /**
     * Delete old audit logs (cleanup)
     */
    @DELETE
    @Path("/cleanup")
    @Operation(summary = "Cleanup old logs", description = "Delete audit logs older than specified days")
    public Response cleanupOldLogs(
            @QueryParam("days") @DefaultValue("90") @Parameter(description = "Delete logs older than this many days") int days) {
        
        Instant cutoff = Instant.now().minus(days, ChronoUnit.DAYS);
        long deleted = repository.delete("timestamp < ?1", cutoff);
        
        return Response.ok()
            .entity(new CleanupResult(deleted, cutoff.toString()))
            .build();
    }
    
    // DTOs for responses
    public record AuditStats(long total, long events, long registrations, long users) {}
    public record CleanupResult(long deleted, String cutoffDate) {}
}
