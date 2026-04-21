package com.eventmgmt.registrations.codec;

import com.eventmgmt.registrations.model.RegistrationStatus;
import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;

public class RegistrationStatusCodec implements Codec<RegistrationStatus> {

    @Override
    public RegistrationStatus decode(BsonReader reader, DecoderContext decoderContext) {
        String value = reader.readString();
        if (value == null || value.isEmpty()) {
            return RegistrationStatus.PENDING;
        }
        try {
            // Convertir en majuscules pour supporter les deux formats
            return RegistrationStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Valeur par défaut si la valeur est invalide
            return RegistrationStatus.PENDING;
        }
    }

    @Override
    public void encode(BsonWriter writer, RegistrationStatus value, EncoderContext encoderContext) {
        if (value != null) {
            writer.writeString(value.name());
        } else {
            writer.writeString(RegistrationStatus.PENDING.name());
        }
    }

    @Override
    public Class<RegistrationStatus> getEncoderClass() {
        return RegistrationStatus.class;
    }
}
