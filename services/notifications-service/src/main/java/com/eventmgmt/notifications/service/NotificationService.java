package com.eventmgmt.notifications.service;

import com.eventmgmt.notifications.model.Notification;
import com.eventmgmt.notifications.model.NotificationStatus;
import com.eventmgmt.notifications.repository.NotificationRepository;
import com.eventmgmt.notifications.sender.EmailSender;
import com.eventmgmt.notifications.sender.PushSender;
import com.eventmgmt.notifications.sender.SmsSender;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class NotificationService {
    private static final Logger LOG = Logger.getLogger(NotificationService.class);

    @Inject
    NotificationRepository repository;

    @Inject
    EmailSender emailSender;

    @Inject
    SmsSender smsSender;

    @Inject
    PushSender pushSender;

    public List<Notification> list() {
        return repository.listAll();
    }

    public Optional<Notification> get(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public Notification create(Notification notification) {
        // Set default status if not provided
        if (notification.status == null) {
            notification.status = NotificationStatus.PENDING;
        }
        
        repository.persist(notification);
        LOG.infof("Notification created with ID: %s, Type: %s", notification.id, notification.type);
        
        // Send notification asynchronously
        sendNotificationAsync(notification);
        
        return notification;
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }

    /**
     * Send notification asynchronously
     */
    private void sendNotificationAsync(Notification notification) {
        Thread.ofVirtual().start(() -> {
            try {
                sendNotification(notification);
            } catch (Exception e) {
                LOG.errorf(e, "Error in async notification send for ID: %s", notification.id);
            }
        });
    }

    /**
     * Send notification based on type
     */
    public void sendNotification(Notification notification) {
        try {
            LOG.infof("Sending notification ID: %s, Type: %s", notification.id, notification.type);
            
            switch (notification.type) {
                case EMAIL:
                    emailSender.send(
                        notification.recipientId, 
                        "Event Management Notification", 
                        notification.message
                    );
                    break;
                    
                case SMS:
                    smsSender.send(notification.recipientId, notification.message);
                    break;
                    
                case PUSH:
                    pushSender.send(
                        notification.recipientId, 
                        "Notification", 
                        notification.message
                    );
                    break;
                    
                default:
                    LOG.warnf("Unknown notification type: %s", notification.type);
                    throw new IllegalArgumentException("Unknown notification type: " + notification.type);
            }
            
            // Update status to SENT
            notification.status = NotificationStatus.SENT;
            repository.update(notification);
            
            LOG.infof("Notification sent successfully: ID=%s, Type=%s", notification.id, notification.type);
            
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send notification: ID=%s, Type=%s", notification.id, notification.type);
            
            // Update status to FAILED
            notification.status = NotificationStatus.FAILED;
            repository.update(notification);
        }
    }

    /**
     * Scheduled task to process pending notifications every minute
     */
    @Scheduled(every = "60s")
    void processPendingNotifications() {
        LOG.debug("Processing pending notifications...");
        
        List<Notification> pendingNotifications = repository.find(
            "status", NotificationStatus.PENDING
        ).list();
        
        if (!pendingNotifications.isEmpty()) {
            LOG.infof("Found %d pending notifications to process", pendingNotifications.size());
            
            for (Notification notification : pendingNotifications) {
                sendNotificationAsync(notification);
            }
        }
    }

    /**
     * Retry failed notifications
     */
    public void retryFailedNotification(String id) {
        Optional<Notification> optNotification = get(id);
        
        if (optNotification.isPresent()) {
            Notification notification = optNotification.get();
            
            if (notification.status == NotificationStatus.FAILED) {
                LOG.infof("Retrying failed notification: ID=%s", id);
                notification.status = NotificationStatus.PENDING;
                repository.update(notification);
                sendNotificationAsync(notification);
            } else {
                LOG.warnf("Cannot retry notification with status: %s", notification.status);
            }
        }
    }
}
