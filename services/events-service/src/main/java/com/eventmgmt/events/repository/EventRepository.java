package com.eventmgmt.events.repository;

import com.eventmgmt.events.model.Event;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class EventRepository implements PanacheMongoRepository<Event> {
}
