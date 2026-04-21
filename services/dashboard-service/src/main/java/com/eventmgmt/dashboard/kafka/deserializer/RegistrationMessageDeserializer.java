package com.eventmgmt.dashboard.kafka.deserializer;

import com.eventmgmt.dashboard.dto.RegistrationMessage;
import io.quarkus.kafka.client.serialization.JsonbDeserializer;

public class RegistrationMessageDeserializer extends JsonbDeserializer<RegistrationMessage> {
    public RegistrationMessageDeserializer() {
        super(RegistrationMessage.class);
    }
}
