package com.eventmgmt.dashboard.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "dashboards")
public class DashboardSnapshot extends PanacheMongoEntity {
    public String organizerId;
    public int totalEvents;
    public int totalRegistrations;
    public double totalCharges;
}
