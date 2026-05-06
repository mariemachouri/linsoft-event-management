package com.eventmgmt.charges.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "charge_catalog")
public class ChargeCatalogItem extends PanacheMongoEntity {
    public String name;
    public String description;
    public ChargeCategory category;
    public String unit; // "pièce", "heure", "jour", "forfait"
    public double defaultUnitPrice;
    public String currency = "EUR";
    public boolean active = true;
    public String createdAt;
    public String updatedAt;
}
