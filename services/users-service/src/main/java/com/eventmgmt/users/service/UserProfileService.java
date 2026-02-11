package com.eventmgmt.users.service;

import com.eventmgmt.users.model.UserProfile;
import com.eventmgmt.users.repository.UserProfileRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class UserProfileService {
    @Inject
    UserProfileRepository repository;

    public List<UserProfile> list() {
        return repository.listAll();
    }

    public Optional<UserProfile> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public UserProfile create(UserProfile profile) {
        repository.persist(profile);
        return profile;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}
