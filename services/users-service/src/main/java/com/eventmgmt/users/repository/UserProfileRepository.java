package com.eventmgmt.users.repository;

import com.eventmgmt.users.model.UserProfile;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserProfileRepository implements PanacheMongoRepository<UserProfile> {
}
