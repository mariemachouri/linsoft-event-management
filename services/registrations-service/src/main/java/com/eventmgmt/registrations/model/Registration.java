package com.eventmgmt.registrations.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "registrations")
public class Registration extends PanacheMongoEntity {
    public String eventId;
    public String participantId;
    public String status;
    public String registeredAt;
}
