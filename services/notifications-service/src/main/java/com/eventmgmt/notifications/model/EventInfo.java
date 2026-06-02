package com.eventmgmt.notifications.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

/**
 * Cache local des informations d'événement (alimenté par le topic event.created).
 * Sert au calcul des rappels (date de début) sans appeler events-service.
 */
@MongoEntity(collection = "event_info")
public class EventInfo extends PanacheMongoEntity {
    public String eventId;
    public String title;
    public String location;
    public String startDate; // format ISO brut tel que reçu de events-service

    // Événement en ligne + lien Google Meet (envoyé par email aux inscrits)
    public Boolean isOnline = false;
    public String meetingLink;
}
