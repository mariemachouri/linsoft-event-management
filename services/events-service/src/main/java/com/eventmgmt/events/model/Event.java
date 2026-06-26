package com.eventmgmt.events.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.util.ArrayList;
import java.util.List;

@MongoEntity(collection = "events")
public class Event extends PanacheMongoEntity {
    public String title;
    public String name;  // Alias for title (for compatibility with frontend)
    public String description;
    public String location;
    public String startAt;
    public String endAt;
    public String startDate;  // Alias for startAt (for compatibility with frontend)
    public String endDate;    // Alias for endAt (for compatibility with frontend)
    public Integer maxParticipants;
    public Integer currentParticipants;
    public String organizerId;
    public String imageUrl;

    // Coordonnées géographiques du lieu
    public Double locationLat;
    public Double locationLng;

    // Événement en ligne (formation/workshop) + lien Google Meet privé (admin only)
    public Boolean isOnline = false;
    public String meetingLink;
    public EventCategory category;
    public EventStatus status = EventStatus.DRAFT;
    public List<String> chargeIds = new ArrayList<>();
    public String chargePredictionId;
    public String eventStatisticsId;
}
