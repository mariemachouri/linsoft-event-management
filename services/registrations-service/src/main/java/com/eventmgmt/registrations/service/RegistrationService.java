package com.eventmgmt.registrations.service;

import com.eventmgmt.registrations.kafka.RegistrationPublisher;
import com.eventmgmt.registrations.model.Registration;
import com.eventmgmt.registrations.repository.RegistrationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class RegistrationService {
    @Inject
    RegistrationRepository repository;

    @Inject
    RegistrationPublisher registrationPublisher;

    public List<Registration> list() {
        return repository.listAll();
    }

    public Optional<Registration> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public Registration create(Registration registration) {
        // Set registration timestamp if not already set
        if (registration.registeredAt == null) {
            registration.registeredAt = Instant.now().toString();
        }
        // Default isGuest to false if not set
        if (registration.isGuest == null) {
            registration.isGuest = false;
        }
        repository.persist(registration);

        // Publish registration creation to Kafka
        registrationPublisher.publishRegistrationCreated(registration);
        
        return registration;
    }

    public Registration confirmRegistration(String id) {
        Registration registration = repository.findByIdOptional(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Registration not found"));
        
        registration.status = "CONFIRMED";
        repository.update(registration);
        
        // Publish confirmation to Kafka
        registrationPublisher.publishRegistrationConfirmed(registration);
        
        return registration;
    }

    public Registration updateStatus(String id, String newStatus) {
        Registration registration = repository.findByIdOptional(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Registration not found"));
        registration.setStatus(newStatus);
        repository.update(registration);
        return registration;
    }

    public Registration cancelRegistration(String id) {
        Registration registration = repository.findByIdOptional(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Registration not found"));
        registration.status = "CANCELLED";
        repository.update(registration);
        // Publish cancellation to Kafka
        registrationPublisher.publishRegistrationCancelled(registration);
        return registration;
    }

    public boolean delete(String id) {
        // Get registration before deletion for Kafka message
        Optional<Registration> registrationOpt = repository.findByIdOptional(new ObjectId(id));
        boolean deleted = repository.deleteById(new ObjectId(id));
        
        if (deleted && registrationOpt.isPresent()) {
            Registration registration = registrationOpt.get();
            registration.status = "CANCELLED";
            // Publish cancellation to Kafka
            registrationPublisher.publishRegistrationCancelled(registration);
        }
        
        return deleted;
    }
}
