package com.eventmgmt.notifications.repository;

import com.eventmgmt.notifications.model.Notification;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class NotificationRepository implements PanacheMongoRepository<Notification> {
}
