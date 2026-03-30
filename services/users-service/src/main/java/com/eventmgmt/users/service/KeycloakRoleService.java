package com.eventmgmt.users.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RolesResource;
import org.keycloak.representations.idm.RoleRepresentation;

import java.util.List;

@ApplicationScoped
public class KeycloakRoleService {
    
    private static final Logger LOG = Logger.getLogger(KeycloakRoleService.class);
    
    @Inject
    Keycloak keycloak;
    
    @ConfigProperty(name = "keycloak.realm")
    String realm;
    
    public List<RoleRepresentation> getAllRoles() {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            RolesResource rolesResource = realmResource.roles();
            return rolesResource.list();
        } catch (Exception e) {
            LOG.error("Error fetching roles from Keycloak", e);
            throw new WebApplicationException("Failed to fetch roles", 500);
        }
    }
    
    public RoleRepresentation getRoleByName(String roleName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            return realmResource.roles().get(roleName).toRepresentation();
        } catch (Exception e) {
            LOG.error("Error fetching role: " + roleName, e);
            return null;
        }
    }
    
    public void createRole(String name, String description) {
        try {
            RoleRepresentation role = new RoleRepresentation();
            role.setName(name);
            role.setDescription(description);
            
            RealmResource realmResource = keycloak.realm(realm);
            realmResource.roles().create(role);
            LOG.info("Role created successfully: " + name);
        } catch (Exception e) {
            LOG.error("Error creating role: " + name, e);
            throw new WebApplicationException("Failed to create role: " + e.getMessage(), 500);
        }
    }
    
    public void updateRole(String currentName, String newName, String description) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            RoleRepresentation role = realmResource.roles().get(currentName).toRepresentation();
            
            if (newName != null && !newName.equals(currentName)) {
                role.setName(newName);
            }
            if (description != null) {
                role.setDescription(description);
            }
            
            realmResource.roles().get(currentName).update(role);
            LOG.info("Role updated successfully: " + currentName);
        } catch (Exception e) {
            LOG.error("Error updating role: " + currentName, e);
            throw new WebApplicationException("Failed to update role: " + e.getMessage(), 500);
        }
    }
    
    public void deleteRole(String roleName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            realmResource.roles().deleteRole(roleName);
            LOG.info("Role deleted successfully: " + roleName);
        } catch (Exception e) {
            LOG.error("Error deleting role: " + roleName, e);
            throw new WebApplicationException("Failed to delete role: " + e.getMessage(), 500);
        }
    }
}
