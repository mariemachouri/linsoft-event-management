package com.eventmgmt.notifications.sender;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import io.quarkus.runtime.Startup;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.FileInputStream;
import java.io.IOException;

@ApplicationScoped
@Startup
public class PushSender {
    private static final Logger LOG = Logger.getLogger(PushSender.class);

    @ConfigProperty(name = "firebase.credentials.path", defaultValue = "")
    String credentialsPath;

    @ConfigProperty(name = "firebase.enabled", defaultValue = "false")
    boolean firebaseEnabled;

    private boolean initialized = false;

    @PostConstruct
    void init() {
        if (!firebaseEnabled) {
            LOG.info("Firebase is disabled - Push notifications will be logged only");
            return;
        }

        if (credentialsPath.isEmpty()) {
            LOG.warn("Firebase credentials path is not configured - Push notifications will be disabled");
            return;
        }

        try {
            FileInputStream serviceAccount = new FileInputStream(credentialsPath);
            
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();
            
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                initialized = true;
                LOG.info("Firebase initialized successfully");
            }
        } catch (IOException e) {
            LOG.warn("Failed to initialize Firebase - Push notifications will be disabled", e);
        }
    }

    public void send(String deviceToken, String title, String body) {
        if (!firebaseEnabled || !initialized) {
            LOG.infof("Push notification (disabled): Token: %s, Title: %s, Body: %s", 
                      deviceToken, title, body);
            return;
        }

        try {
            LOG.infof("Sending push notification to device: %s", deviceToken);
            
            Message message = Message.builder()
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .setToken(deviceToken)
                .build();
            
            String response = FirebaseMessaging.getInstance().send(message);
            
            LOG.infof("Push notification sent successfully. Response: %s", response);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send push notification to device: %s", deviceToken);
            throw new RuntimeException("Failed to send push notification", e);
        }
    }
}
