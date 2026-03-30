package com.eventmgmt.dashboard.service.com.eventmgmt.dashboard.service;

import com.eventmgmt.dashboard.model.DashboardSnapshot;
import com.eventmgmt.dashboard.repository.DashboardSnapshotRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class DashboardSnapshotService {
    @Inject
    DashboardSnapshotRepository repository;

    public List<DashboardSnapshot> list() {
        return repository.listAll();
    }

    public Optional<DashboardSnapshot> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public DashboardSnapshot create(DashboardSnapshot snapshot) {
        repository.persist(snapshot);
        return snapshot;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}
