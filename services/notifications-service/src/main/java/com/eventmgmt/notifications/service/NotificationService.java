package com.eventmgmt.notifications.service;

import com.eventmgmt.notifications.model.Notification;
import com.eventmgmt.notifications.repository.NotificationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class NotificationService {
    @Inject
    NotificationRepository repository;

    public List<Notification> list() {
        return repository.listAll();
    }

    public Optional<Notification> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public Notification create(Notification notification) {
        repository.persist(notification);
        return notification;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}
