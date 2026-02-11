package com.eventmgmt.events.service;

import com.eventmgmt.events.model.Event;
import com.eventmgmt.events.repository.EventRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class EventService {
    @Inject
    EventRepository repository;

    public List<Event> list() {
        return repository.listAll();
    }

    public Optional<Event> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public Event create(Event event) {
        repository.persist(event);
        return event;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}
