package com.eventmgmt.users.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;

@ApplicationScoped
public class KeycloakConfig {
    
    @ConfigProperty(name = "keycloak.admin.url")
    String keycloakAdminUrl;
    
    @ConfigProperty(name = "keycloak.admin.realm", defaultValue = "master")
    String adminRealm;
    
    @ConfigProperty(name = "keycloak.admin.username")
    String adminUsername;
    
    @ConfigProperty(name = "keycloak.admin.password")
    String adminPassword;
    
    @ConfigProperty(name = "keycloak.admin.client-id", defaultValue = "admin-cli")
    String adminClientId;
    
    @Produces
    @ApplicationScoped
    public Keycloak keycloakClient() {
        return KeycloakBuilder.builder()
                .serverUrl(keycloakAdminUrl)
                .realm(adminRealm)
                .username(adminUsername)
                .password(adminPassword)
                .clientId(adminClientId)
                .build();
    }
}
