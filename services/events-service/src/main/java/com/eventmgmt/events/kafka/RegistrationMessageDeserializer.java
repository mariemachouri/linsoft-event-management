package com.eventmgmt.events.kafka;

import io.quarkus.kafka.client.serialization.ObjectMapperDeserializer;

/**
 * Kafka deserializer for RegistrationMessage objects sent by the registrations-service.
 */
public class RegistrationMessageDeserializer extends ObjectMapperDeserializer<RegistrationMessage> {
    public RegistrationMessageDeserializer() {
        super(RegistrationMessage.class);
    }
}
