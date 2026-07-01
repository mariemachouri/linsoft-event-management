package com.eventmgmt.registrations.service;

import com.eventmgmt.registrations.kafka.RegistrationPublisher;
import com.eventmgmt.registrations.model.Registration;
import com.eventmgmt.registrations.repository.RegistrationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class RegistrationService {

    private static final Logger LOG = Logger.getLogger(RegistrationService.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @ConfigProperty(name = "events.service.url", defaultValue = "http://localhost:8081")
    String eventsServiceUrl;

    @Inject
    RegistrationRepository repository;

    @Inject
    RegistrationPublisher registrationPublisher;

    private void updateParticipantCount(String eventId, String action) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(eventsServiceUrl + "/api/events/" + eventId + "/participants/" + action))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(3))
                    .build();
            httpClient.send(req, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            LOG.warnf("Could not %s participants for event %s: %s", action, eventId, e.getMessage());
        }
    }

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

        // Synchronous update of participant counter (primary)
        updateParticipantCount(registration.eventId, "increment");

        // Async Kafka notification (secondary)
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

        // Synchronous update of participant counter (primary)
        updateParticipantCount(registration.eventId, "decrement");

        // Async Kafka notification (secondary)
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
            updateParticipantCount(registration.eventId, "decrement");
            registrationPublisher.publishRegistrationCancelled(registration);
        }
        
        return deleted;
    }
}
