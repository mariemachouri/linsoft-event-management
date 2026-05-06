package com.eventmgmt.charges.repository;

import com.eventmgmt.charges.model.ChargeCatalogItem;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ChargeCatalogRepository implements PanacheMongoRepository<ChargeCatalogItem> {
}
