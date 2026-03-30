package com.eventmgmt.users.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@EqualsAndHashCode(callSuper = true)
@MongoEntity(collection = "users")
public class UserProfile extends PanacheMongoEntity {
    
    private String keycloakId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Set<UserRole> roles = new HashSet<>();
    private Boolean enabled = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
