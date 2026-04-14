package com.eventmgmt.users.service;

import com.eventmgmt.users.dto.UserCreateRequest;
import com.eventmgmt.users.dto.UserResponse;
import com.eventmgmt.users.dto.UserUpdateRequest;
import com.eventmgmt.users.kafka.UserPublisher;
import com.eventmgmt.users.model.UserProfile;
import com.eventmgmt.users.model.UserRole;
import com.eventmgmt.users.repository.UserProfileRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class UserProfileService {
    
    private static final Logger LOG = Logger.getLogger(UserProfileService.class);
    
    @Inject
    UserProfileRepository repository;
    
    @Inject
    Keycloak keycloak;
    
    @Inject
    UserPublisher userPublisher;
    
    @ConfigProperty(name = "keycloak.realm")
    String realm;
    
    public List<UserResponse> getAllUsers() {
        List<UserProfile> profiles = repository.listAll();
        return profiles.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    public Optional<UserResponse> getUserById(String id) {
        return repository.findByIdOptional(new ObjectId(id))
            .map(this::mapToResponse);
    }
    
    public Optional<UserResponse> getUserByUsername(String username) {
        UserProfile profile = repository.find("username", username).firstResult();
        return Optional.ofNullable(profile).map(this::mapToResponse);
    }
    
    // @Transactional // Désactivé pour MongoDB standalone
    public UserResponse createUser(UserCreateRequest request) {
        // Check if user already exists in MongoDB
        UserProfile existingProfile = repository.find("username", request.getUsername()).firstResult();
        if (existingProfile != null) {
            throw new WebApplicationException("User already exists", 409);
        }
        
        // Create user in Keycloak
        String keycloakUserId;
        try {
            keycloakUserId = createKeycloakUser(request);
        } catch (Exception e) {
            LOG.error("Failed to create user in Keycloak", e);
            throw new WebApplicationException("Failed to create user: " + e.getMessage(), 500);
        }
        
        // Create user profile in MongoDB
        UserProfile profile = new UserProfile();
        profile.setKeycloakId(keycloakUserId);
        profile.setUsername(request.getUsername());
        profile.setEmail(request.getEmail());
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setRoles(request.getRoles() != null ? request.getRoles() : new HashSet<>());
        profile.setEnabled(request.getEnabled());
        profile.prePersist();
        
        repository.persist(profile);
        LOG.info("User created successfully: " + request.getUsername());
        
        // Publish user creation to Kafka (asynchronous)
        userPublisher.publishUserCreated(profile);
        
        return mapToResponse(profile);
    }
    
    // @Transactional // Désactivé pour MongoDB standalone
    public UserResponse updateUser(String id, UserUpdateRequest request) {
        UserProfile profile = repository.findByIdOptional(new ObjectId(id))
            .orElseThrow(() -> new WebApplicationException("User not found", 404));
        
        // Update in Keycloak
        try {
            updateKeycloakUser(profile.getKeycloakId(), request);
        } catch (Exception e) {
            LOG.error("Failed to update user in Keycloak", e);
            throw new WebApplicationException("Failed to update user: " + e.getMessage(), 500);
        }
        
        // Update in MongoDB
        if (request.getEmail() != null) {
            profile.setEmail(request.getEmail());
        }
        if (request.getFirstName() != null) {
            profile.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            profile.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            profile.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getRoles() != null) {
            profile.setRoles(request.getRoles());
        }
        if (request.getEnabled() != null) {
            profile.setEnabled(request.getEnabled());
        }
        profile.preUpdate();
        
        repository.update(profile);
        LOG.info("User updated successfully: " + profile.getUsername());
       
        // Publish user update to Kafka
        userPublisher.publishUserUpdated(profile);
        
        return mapToResponse(profile);
    }
    
    // @Transactional // Désactivé pour MongoDB standalone
    public void deleteUser(String id) {
        UserProfile profile = repository.findByIdOptional(new ObjectId(id))
            .orElseThrow(() -> new WebApplicationException("User not found", 404));
        
        // Delete from Keycloak
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            usersResource.delete(profile.getKeycloakId());
        } catch (Exception e) {
            LOG.error("Failed to delete user from Keycloak", e);
            throw new WebApplicationException("Failed to delete user: " + e.getMessage(), 500);
        }
        
        // Delete from MongoDB
        repository.deleteById(new ObjectId(id));
        LOG.info("User deleted successfully: " + profile.getUsername());
        
        // Publish user deletion to Kafka
        userPublisher.publishUserDeleted(profile);
    }
    
    // @Transactional // Désactivé pour MongoDB standalone
    public void assignRolesToUser(String userId, Set<UserRole> roleNames) {
        UserProfile profile = repository.findByIdOptional(new ObjectId(userId))
            .orElseThrow(() -> new WebApplicationException("User not found", 404));
        
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(profile.getKeycloakId());
            
            List<RoleRepresentation> roles = roleNames.stream()
                .map(role -> {
                    try {
                        return realmResource.roles().get(toKeycloakRoleName(role)).toRepresentation();
                    } catch (Exception e) {
                        LOG.warn("Role not found: " + role);
                        return null;
                    }
                })
                .filter(role -> role != null)
                .collect(Collectors.toList());
            
            userResource.roles().realmLevel().add(roles);
            
            // Update in MongoDB
            profile.setRoles(roleNames);
            profile.preUpdate();
            repository.update(profile);
            
            LOG.info("Roles assigned to user: " + profile.getUsername());
        } catch (Exception e) {
            LOG.error("Failed to assign roles to user", e);
            throw new WebApplicationException("Failed to assign roles: " + e.getMessage(), 500);
        }
    }
    
    // @Transactional // Désactivé pour MongoDB standalone
    public void removeRolesFromUser(String userId, Set<UserRole> roleNames) {
        UserProfile profile = repository.findByIdOptional(new ObjectId(userId))
            .orElseThrow(() -> new WebApplicationException("User not found", 404));
        
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(profile.getKeycloakId());
            
            List<RoleRepresentation> roles = roleNames.stream()
                .map(role -> {
                    try {
                        return realmResource.roles().get(toKeycloakRoleName(role)).toRepresentation();
                    } catch (Exception e) {
                        LOG.warn("Role not found: " + role);
                        return null;
                    }
                })
                .filter(role -> role != null)
                .collect(Collectors.toList());
            
            userResource.roles().realmLevel().remove(roles);
            
            // Update in MongoDB
            Set<UserRole> currentRoles = new HashSet<>(profile.getRoles());
            currentRoles.removeAll(roleNames);
            profile.setRoles(currentRoles);
            profile.preUpdate();
            repository.update(profile);
            
            LOG.info("Roles removed from user: " + profile.getUsername());
        } catch (Exception e) {
            LOG.error("Failed to remove roles from user", e);
            throw new WebApplicationException("Failed to remove roles: " + e.getMessage(), 500);
        }
    }
    
    private String createKeycloakUser(UserCreateRequest request) {
        RealmResource realmResource = keycloak.realm(realm);
        UsersResource usersResource = realmResource.users();
        
        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEnabled(request.getEnabled());
        user.setEmailVerified(false);
        
        // Create user
        var response = usersResource.create(user);
        if (response.getStatus() != 201) {
            throw new WebApplicationException("Failed to create user in Keycloak: " + response.getStatusInfo(), response.getStatus());
        }
        
        String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
        
        // Set password
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(false);
        
        UserResource userResource = usersResource.get(userId);
        userResource.resetPassword(credential);
        
        // Assign roles if provided
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            List<RoleRepresentation> roles = request.getRoles().stream()
                .map(role -> {
                    try {
                        return realmResource.roles().get(toKeycloakRoleName(role)).toRepresentation();
                    } catch (Exception e) {
                        LOG.warn("Role not found: " + role);
                        return null;
                    }
                })
                .filter(role -> role != null)
                .collect(Collectors.toList());
            
            if (!roles.isEmpty()) {
                userResource.roles().realmLevel().add(roles);
            }
        }
        
        return userId;
    }
    
    private void updateKeycloakUser(String keycloakUserId, UserUpdateRequest request) {
        RealmResource realmResource = keycloak.realm(realm);
        UserResource userResource = realmResource.users().get(keycloakUserId);
        UserRepresentation user = userResource.toRepresentation();
        
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        
        userResource.update(user);
        
        // Update roles if provided
        if (request.getRoles() != null) {
            // Get current roles
            List<RoleRepresentation> currentRoles = userResource.roles().realmLevel().listEffective();
            
            // Remove all current roles
            if (!currentRoles.isEmpty()) {
                userResource.roles().realmLevel().remove(currentRoles);
            }
            
            // Add new roles
            List<RoleRepresentation> newRoles = request.getRoles().stream()
                .map(role -> {
                    try {
                        return realmResource.roles().get(toKeycloakRoleName(role)).toRepresentation();
                    } catch (Exception e) {
                        LOG.warn("Role not found: " + role);
                        return null;
                    }
                })
                .filter(role -> role != null)
                .collect(Collectors.toList());
            
            if (!newRoles.isEmpty()) {
                userResource.roles().realmLevel().add(newRoles);
            }
        }
    }
    
    private UserResponse mapToResponse(UserProfile profile) {
        return UserResponse.builder()
            .id(profile.id.toString())
            .keycloakId(profile.getKeycloakId())
            .username(profile.getUsername())
            .email(profile.getEmail())
            .firstName(profile.getFirstName())
            .lastName(profile.getLastName())
            .phoneNumber(profile.getPhoneNumber())
            .roles(profile.getRoles())
            .enabled(profile.getEnabled())
            .createdAt(profile.getCreatedAt())
            .updatedAt(profile.getUpdatedAt())
            .build();
    }

    private String toKeycloakRoleName(UserRole role) {
        return role.name().toLowerCase();
    }
}
