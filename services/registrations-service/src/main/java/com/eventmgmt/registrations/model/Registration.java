package com.eventmgmt.registrations.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "registrations")
public class Registration extends PanacheMongoEntity {
    public String eventId;
    public String participantId;
    public String status = "PENDING";  // Changé de RegistrationStatus à String
    public String registeredAt;
    
    // Helper method pour valider/normaliser le statut
    public void setStatus(String status) {
        if (status == null || status.isEmpty()) {
            this.status = "PENDING";
        } else {
            // Normaliser en majuscules
            this.status = status.toUpperCase();
        }
    }
    
    // Getter pour compatibilité
    public String getStatus() {
        return this.status != null ? this.status.toUpperCase() : "PENDING";
    }
}
