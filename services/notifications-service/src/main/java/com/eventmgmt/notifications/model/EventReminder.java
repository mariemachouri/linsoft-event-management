package com.eventmgmt.notifications.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

import java.util.ArrayList;
import java.util.List;

/**
 * Abonnement à un événement (créé à chaque inscription).
 * Le scheduler de rappels l'utilise pour envoyer les emails J-10/5/3/2/1/0.
 */
@MongoEntity(collection = "event_reminders")
public class EventReminder extends PanacheMongoEntity {
    public String eventId;
    public String email;
    public String phone;
    public String name;
    public boolean guest;

    /** Paliers (en jours) déjà envoyés — évite les doublons. */
    public List<Integer> remindersSent = new ArrayList<>();
}
