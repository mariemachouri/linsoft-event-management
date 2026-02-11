package com.eventmgmt.registrations.repository;

import com.eventmgmt.registrations.model.Registration;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RegistrationRepository implements PanacheMongoRepository<Registration> {
}
