package com.eventmgmt.charges.service;

import com.eventmgmt.charges.model.ChargeItem;
import com.eventmgmt.charges.model.ChargeStatus;
import com.eventmgmt.charges.repository.ChargeItemRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class ChargeItemService {
    @Inject
    ChargeItemRepository repository;

    @Inject
    ChargeCatalogService catalogService;

    public List<ChargeItem> list() {
        return repository.listAll();
    }

    public List<ChargeItem> listByEventId(String eventId) {
        return repository.find("eventId", eventId).list();
    }

    public List<ChargeItem> listByStatus(ChargeStatus status) {
        return repository.find("status", status).list();
    }

    public List<ChargeItem> listByEventIdAndStatus(String eventId, ChargeStatus status) {
        return repository.find("eventId = ?1 and status = ?2", eventId, status).list();
    }

    public Optional<ChargeItem> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public ChargeItem create(ChargeItem item) {
        // Si un item du catalogue est référencé, on pré-remplit les champs manquants
        if (item.catalogItemId != null && !item.catalogItemId.isBlank()) {
            catalogService.findById(item.catalogItemId).ifPresent(catalog -> {
                if (item.description == null || item.description.isBlank()) {
                    item.description = catalog.name + " – " + catalog.description;
                }
                if (item.category == null) item.category = catalog.category;
                if (item.currency == null) item.currency = catalog.currency;
                // Prix unitaire : depuis catalogue si non fourni
                if (item.unitPrice <= 0) item.unitPrice = catalog.defaultUnitPrice;
            });
        }
        // Calcul automatique du montant total
        if (item.quantity <= 0) item.quantity = 1;
        if (item.unitPrice > 0 && item.amount <= 0) {
            item.amount = item.quantity * item.unitPrice;
        }
        if (item.currency == null) item.currency = "EUR";
        item.createdAt = LocalDateTime.now().toString();
        item.updatedAt = item.createdAt;
        repository.persist(item);
        return item;
    }

    public Optional<ChargeItem> update(String id, ChargeItem updated) {
        return repository.findByIdOptional(new ObjectId(id)).map(existing -> {
            if (updated.description != null) existing.description = updated.description;
            if (updated.category != null)    existing.category = updated.category;
            if (updated.currency != null)    existing.currency = updated.currency;
            if (updated.item != null)        existing.item = updated.item;
            if (updated.status != null)      existing.status = updated.status;
            if (updated.paymentInfo != null) existing.paymentInfo = updated.paymentInfo;
            if (updated.catalogItemId != null) existing.catalogItemId = updated.catalogItemId;
            // Recalcul montant si quantité ou prix unitaire modifiés
            if (updated.quantity > 0)    existing.quantity  = updated.quantity;
            if (updated.unitPrice > 0)   existing.unitPrice = updated.unitPrice;
            if (existing.quantity > 0 && existing.unitPrice > 0) {
                existing.amount = existing.quantity * existing.unitPrice;
            } else if (updated.amount > 0) {
                existing.amount = updated.amount;
            }
            existing.updatedAt = LocalDateTime.now().toString();
            repository.update(existing);
            return existing;
        });
    }

    public Optional<ChargeItem> updateStatus(String id, ChargeStatus status) {
        return repository.findByIdOptional(new ObjectId(id)).map(existing -> {
            existing.status = status;
            existing.updatedAt = LocalDateTime.now().toString();
            repository.update(existing);
            return existing;
        });
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }

    // Alias kept for backward compatibility
    public List<ChargeItem> getByEventId(String eventId) {
        return listByEventId(eventId);
    }
}
