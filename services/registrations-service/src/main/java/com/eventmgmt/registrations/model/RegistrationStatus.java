package com.eventmgmt.registrations.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RegistrationStatus {
    CONFIRMED,
    PENDING,
    WAITLISTED,
    CANCELLED;

    @JsonValue
    public String toValue() {
        return name();
    }

    @JsonCreator
    public static RegistrationStatus fromValue(String value) {
        if (value == null) {
            return PENDING;
        }
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }
}