package com.eventmgmt.dashboard.repository.com.eventmgmt.dashboard.repository;

import com.eventmgmt.dashboard.model.DashboardSnapshot;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DashboardSnapshotRepository implements PanacheMongoRepository<DashboardSnapshot> {
}
