package com.eventmgmt.dashboard.kafka.deserializer;

import com.eventmgmt.dashboard.dto.UserMessage;
import io.quarkus.kafka.client.serialization.JsonbDeserializer;

public class UserMessageDeserializer extends JsonbDeserializer<UserMessage> {
    public UserMessageDeserializer() {
        super(UserMessage.class);
    }
}
