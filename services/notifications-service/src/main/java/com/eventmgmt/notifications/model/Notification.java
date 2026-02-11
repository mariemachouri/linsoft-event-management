package com.eventmgmt.notifications.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "notifications")
public class Notification extends PanacheMongoEntity {
    public String recipientId;
    public String channel;
    public String message;
    public String status;
    public String sendAt;
}
