package com.eventmgmt.notifications.dto;

import io.quarkus.kafka.client.serialization.ObjectMapperDeserializer;

public class RegistrationMessageDeserializer extends ObjectMapperDeserializer<RegistrationMessage> {
    public RegistrationMessageDeserializer() {
        super(RegistrationMessage.class);
    }
}
