package com.eventmgmt.registrations.service;

import com.eventmgmt.registrations.model.Registration;
import com.eventmgmt.registrations.repository.RegistrationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class RegistrationService {
    @Inject
    RegistrationRepository repository;

    public List<Registration> list() {
        return repository.listAll();
    }

    public Optional<Registration> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public Registration create(Registration registration) {
        repository.persist(registration);
        return registration;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}
