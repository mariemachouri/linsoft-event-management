package com.eventmgmt.registrations.codec;

import com.eventmgmt.registrations.model.RegistrationStatus;
import org.bson.codecs.Codec;
import org.bson.codecs.configuration.CodecProvider;
import org.bson.codecs.configuration.CodecRegistry;

public class RegistrationStatusCodecProvider implements CodecProvider {

    @Override
    @SuppressWarnings("unchecked")
    public <T> Codec<T> get(Class<T> clazz, CodecRegistry registry) {
        if (clazz == RegistrationStatus.class) {
            return (Codec<T>) new RegistrationStatusCodec();
        }
        return null;
    }
}
