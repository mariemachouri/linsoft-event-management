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
        if (event.status == null) {
            event.status = com.eventmgmt.events.model.EventStatus.DRAFT;
        }
        repository.persist(event);
        return event;
    }

    public Event addCharge(String eventId, String chargeId) {
        Event event = repository.findByIdOptional(new ObjectId(eventId))
            .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.chargeIds.contains(chargeId)) {
            event.chargeIds.add(chargeId);
            repository.update(event);
        }
        return event;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}
