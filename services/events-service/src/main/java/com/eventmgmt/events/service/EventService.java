package com.eventmgmt.events.service;

import com.eventmgmt.events.kafka.EventPublisher;
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

    @Inject
    EventPublisher eventPublisher;

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
        // Sync name/title aliases
        if (event.name != null && event.title == null) {
            event.title = event.name;
        } else if (event.title != null && event.name == null) {
            event.name = event.title;
        }
        // Sync startDate/startAt aliases
        if (event.startDate != null && event.startAt == null) {
            event.startAt = event.startDate;
        } else if (event.startAt != null && event.startDate == null) {
            event.startDate = event.startAt;
        }
        // Sync endDate/endAt aliases
        if (event.endDate != null && event.endAt == null) {
            event.endAt = event.endDate;
        } else if (event.endAt != null && event.endDate == null) {
            event.endDate = event.endAt;
        }
        repository.persist(event);
        
        // Publish event creation to Kafka (asynchronous)
        eventPublisher.publishEventCreated(event);
        
        return event;
    }

    public Event update(String id, Event event) {
        Event existingEvent = repository.findByIdOptional(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Update fields - handle both old and new naming conventions
        if (event.title != null) {
            existingEvent.title = event.title;
            existingEvent.name = event.title;  // Sync alias
        } else if (event.name != null) {
            existingEvent.name = event.name;
            existingEvent.title = event.name;  // Sync alias
        }
        
        if (event.description != null) {
            existingEvent.description = event.description;
        }
        
        if (event.location != null) {
            existingEvent.location = event.location;
        }
        
        if (event.startAt != null) {
            existingEvent.startAt = event.startAt;
            existingEvent.startDate = event.startAt;  // Sync alias
        } else if (event.startDate != null) {
            existingEvent.startDate = event.startDate;
            existingEvent.startAt = event.startDate;  // Sync alias
        }
        
        if (event.endAt != null) {
            existingEvent.endAt = event.endAt;
            existingEvent.endDate = event.endAt;  // Sync alias
        } else if (event.endDate != null) {
            existingEvent.endDate = event.endDate;
            existingEvent.endAt = event.endDate;  // Sync alias
        }
        
        if (event.maxParticipants != null) {
            existingEvent.maxParticipants = event.maxParticipants;
        }
        
        if (event.status != null) {
            existingEvent.status = event.status;
        }
        
        if (event.category != null) {
            existingEvent.category = event.category;
        }
        
        if (event.organizerId != null) {
            existingEvent.organizerId = event.organizerId;
        }
        
        repository.update(existingEvent);
        
        // Publish event update to Kafka
        eventPublisher.publishEventUpdated(existingEvent);
        
        return existingEvent;
    }

    public Event addCharge(String eventId, String chargeId) {
        Event event = repository.findByIdOptional(new ObjectId(eventId))
            .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.chargeIds.contains(chargeId)) {
            event.chargeIds.add(chargeId);
            repository.update(event);
            
            // Publish event update to Kafka
            eventPublisher.publishEventUpdated(event);
        }
        return event;
    }

    public boolean delete(String id) {
        // Get event before deletion for Kafka message
        Optional<Event> eventOpt = repository.findByIdOptional(new ObjectId(id));
        boolean deleted = repository.deleteById(new ObjectId(id));
        
        if (deleted && eventOpt.isPresent()) {
            // Publish event deletion to Kafka
            eventPublisher.publishEventDeleted(id, eventOpt.get());
        }
        
        return deleted;
    }
}

