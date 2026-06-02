package com.eventmgmt.events.kafka;

import com.eventmgmt.events.model.EventCategory;
import com.eventmgmt.events.model.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for Event messages sent to Kafka
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventMessage {
    private String eventId;
    private String title;
    private String location;
    private String startAt;
    private String endAt;
    private String organizerId;
    private EventCategory category;
    private EventStatus status;
    private Boolean isOnline;
    private String meetingLink;
    private String action; // CREATED, UPDATED, DELETED
    private Instant timestamp;

    public static EventMessage fromEvent(com.eventmgmt.events.model.Event event, String action) {
        EventMessage message = new EventMessage();
        message.setEventId(event.id.toString());
        message.setTitle(event.title != null ? event.title : event.name);
        message.setLocation(event.location);
        message.setStartAt(event.startAt != null ? event.startAt : event.startDate);
        message.setEndAt(event.endAt != null ? event.endAt : event.endDate);
        message.setOrganizerId(event.organizerId);
        message.setCategory(event.category);
        message.setStatus(event.status);
        message.setIsOnline(event.isOnline != null && event.isOnline);
        message.setMeetingLink(event.meetingLink);
        message.setAction(action);
        message.setTimestamp(Instant.now());
        return message;
    }
}
