package com.eventmgmt.notifications.dto;

import io.quarkus.kafka.client.serialization.ObjectMapperDeserializer;

public class UserMessageDeserializer extends ObjectMapperDeserializer<UserMessage> {
    public UserMessageDeserializer() {
        super(UserMessage.class);
    }
}
