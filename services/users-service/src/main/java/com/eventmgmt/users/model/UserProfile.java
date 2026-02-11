package com.eventmgmt.users.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "users")
public class UserProfile extends PanacheMongoEntity {
    public String username;
    public String email;
    public String role;
    public String status;
}
