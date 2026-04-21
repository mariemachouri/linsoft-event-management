package com.eventmgmt.dashboard.kafka.deserializer;

import com.eventmgmt.dashboard.dto.EventMessage;
import io.quarkus.kafka.client.serialization.JsonbDeserializer;

public class EventMessageDeserializer extends JsonbDeserializer<EventMessage> {
    public EventMessageDeserializer() {
        super(EventMessage.class);
    }
}
