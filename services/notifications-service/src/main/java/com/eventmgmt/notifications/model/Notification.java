package com.eventmgmt.notifications.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "notifications")
public class Notification extends PanacheMongoEntity {
    public String recipientId;
    public NotificationType type;
    public String message;
    public NotificationStatus status = NotificationStatus.PENDING;
    public String sendAt;
}
