package com.eventmgmt.users.service;

import com.eventmgmt.users.dto.LoginRequest;
import com.eventmgmt.users.dto.LoginResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.Form;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class AuthService {
    
    private static final Logger LOG = Logger.getLogger(AuthService.class);
    
    @ConfigProperty(name = "keycloak.admin.url")
    String keycloakUrl;
    
    @ConfigProperty(name = "keycloak.realm")
    String realm;
    
    @ConfigProperty(name = "quarkus.oidc.client-id")
    String clientId;
    
    @ConfigProperty(name = "quarkus.oidc.credentials.secret")
    String clientSecret;
    
    public LoginResponse login(LoginRequest request) {
        Client client = ClientBuilder.newClient();
        try {
            String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", 
                keycloakUrl, realm);
            
            Form form = new Form()
                .param("grant_type", "password")
                .param("client_id", clientId)
                .param("client_secret", clientSecret)
                .param("username", request.getUsername())
                .param("password", request.getPassword());
            
            Response response = client.target(tokenUrl)
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.form(form));
            
            if (response.getStatus() == 200) {
                return response.readEntity(LoginResponse.class);
            } else {
                LOG.error("Login failed with status: " + response.getStatus());
                throw new RuntimeException("Invalid credentials");
            }
        } finally {
            client.close();
        }
    }
    
    public LoginResponse refreshToken(String refreshToken) {
        Client client = ClientBuilder.newClient();
        try {
            String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", 
                keycloakUrl, realm);
            
            Form form = new Form()
                .param("grant_type", "refresh_token")
                .param("client_id", clientId)
                .param("client_secret", clientSecret)
                .param("refresh_token", refreshToken);
            
            Response response = client.target(tokenUrl)
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.form(form));
            
            if (response.getStatus() == 200) {
                return response.readEntity(LoginResponse.class);
            } else {
                LOG.error("Token refresh failed with status: " + response.getStatus());
                throw new RuntimeException("Failed to refresh token");
            }
        } finally {
            client.close();
        }
    }
}
