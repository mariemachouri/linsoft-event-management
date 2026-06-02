package com.eventmgmt.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

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
    private String category;
    private String status;
    private Boolean isOnline;
    private String meetingLink;
    private String action;
    private Instant timestamp;
}
