package com.eventmgmt.charges.repository;

import com.eventmgmt.charges.model.ChargeItem;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ChargeItemRepository implements PanacheMongoRepository<ChargeItem> {
}
