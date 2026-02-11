package com.eventmgmt.charges.service;

import com.eventmgmt.charges.model.ChargeItem;
import com.eventmgmt.charges.repository.ChargeItemRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class ChargeItemService {
    @Inject
    ChargeItemRepository repository;

    public List<ChargeItem> list() {
        return repository.listAll();
    }

    public Optional<ChargeItem> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public ChargeItem create(ChargeItem item) {
        repository.persist(item);
        return item;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
    
    /**
     * Récupérer les charges par event ID
     */
    public List<ChargeItem> getByEventId(String eventId) {
        return repository.find("eventId", eventId).list();
    }
}
