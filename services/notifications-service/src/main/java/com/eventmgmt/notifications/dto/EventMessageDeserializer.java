package com.eventmgmt.notifications.dto;

import io.quarkus.kafka.client.serialization.ObjectMapperDeserializer;

public class EventMessageDeserializer extends ObjectMapperDeserializer<EventMessage> {
    public EventMessageDeserializer() {
        super(EventMessage.class);
    }
}
