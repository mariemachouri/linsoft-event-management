package com.eventmgmt.events.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.util.ArrayList;
import java.util.List;

@MongoEntity(collection = "events")
public class Event extends PanacheMongoEntity {
    public String title;
    public String location;
    public String startAt;
    public String endAt;
    public String organizerId;
    public EventCategory category;
    public EventStatus status = EventStatus.DRAFT;
    public List<String> chargeIds = new ArrayList<>();
    public String chargePredictionId;
    public String eventStatisticsId;
}
