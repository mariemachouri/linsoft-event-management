package com.eventmgmt.events.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "events")
public class Event extends PanacheMongoEntity {
    public String title;
    public String location;
    public String startAt;
    public String endAt;
    public String organizerId;
}
