package com.eventmgmt.users.kafka;

import com.eventmgmt.users.model.UserProfile;
import io.smallrye.reactive.messaging.kafka.Record;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.jboss.logging.Logger;

/**
 * Service responsible for publishing user-related messages to Kafka topics
 */
@ApplicationScoped
public class UserPublisher {
    private static final Logger LOG = Logger.getLogger(UserPublisher.class);

    @Channel("user-created")
    Emitter<Record<String, UserMessage>> userCreatedEmitter;

    @Channel("user-updated")
    Emitter<Record<String, UserMessage>> userUpdatedEmitter;

    @Channel("user-deleted")
    Emitter<Record<String, UserMessage>> userDeletedEmitter;

    /**
     * Publish user creation message
     */
    public void publishUserCreated(UserProfile user) {
        try {
            UserMessage message = UserMessage.fromUserProfile(user, "CREATED");
            String key = user.getKeycloakId() != null ? user.getKeycloakId() : user.id.toString();
            userCreatedEmitter.send(Record.of(key, message));
            LOG.infof("Published user-created message for user: %s", user.getUsername());
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing user-created message for user: %s", user.getUsername());
        }
    }

    /**
     * Publish user update message
     */
    public void publishUserUpdated(UserProfile user) {
        try {
            UserMessage message = UserMessage.fromUserProfile(user, "UPDATED");
            String key = user.getKeycloakId() != null ? user.getKeycloakId() : user.id.toString();
            userUpdatedEmitter.send(Record.of(key, message));
            LOG.infof("Published user-updated message for user: %s", user.getUsername());
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing user-updated message for user: %s", user.getUsername());
        }
    }

    /**
     * Publish user deletion message
     */
    public void publishUserDeleted(UserProfile user) {
        try {
            UserMessage message = UserMessage.fromUserProfile(user, "DELETED");
            String key = user.getKeycloakId() != null ? user.getKeycloakId() : user.id.toString();
            userDeletedEmitter.send(Record.of(key, message));
            LOG.infof("Published user-deleted message for user: %s", user.getUsername());
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing user-deleted message for user: %s", user.getUsername());
        }
    }
}
