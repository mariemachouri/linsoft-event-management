package com.eventmgmt.registrations.config;

import com.eventmgmt.registrations.codec.RegistrationStatusCodecProvider;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import io.quarkus.mongodb.MongoClientName;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.bson.codecs.configuration.CodecRegistries;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;

@ApplicationScoped
public class MongoConfig {

    @Produces
    @ApplicationScoped
    public CodecRegistry codecRegistry() {
        CodecRegistry pojoCodecRegistry = CodecRegistries.fromProviders(
            PojoCodecProvider.builder().automatic(true).build(),
            new RegistrationStatusCodecProvider()
        );
        
        return CodecRegistries.fromRegistries(
            MongoClientSettings.getDefaultCodecRegistry(),
            pojoCodecRegistry
        );
    }
}
