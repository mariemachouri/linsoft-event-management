package com.eventmgmt.notifications.sender;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class SmsSender {
    private static final Logger LOG = Logger.getLogger(SmsSender.class);

    @ConfigProperty(name = "twilio.account.sid")
    String accountSid;
    
    @ConfigProperty(name = "twilio.auth.token")
    String authToken;
    
    @ConfigProperty(name = "twilio.phone.number")
    String fromNumber;

    @ConfigProperty(name = "twilio.enabled", defaultValue = "false")
    boolean twilioEnabled;

    @PostConstruct
    void init() {
        if (twilioEnabled) {
            try {
                Twilio.init(accountSid, authToken);
                LOG.info("Twilio initialized successfully");
            } catch (Exception e) {
                LOG.warn("Failed to initialize Twilio - SMS notifications will be disabled", e);
            }
        } else {
            LOG.info("Twilio is disabled - SMS notifications will be logged only");
        }
    }

    public void send(String recipient, String message) {
        if (!twilioEnabled) {
            LOG.infof("SMS (disabled): To: %s, Message: %s", recipient, message);
            return;
        }

        try {
            LOG.infof("Sending SMS to %s", recipient);
            
            Message twilioMessage = Message.creator(
                new PhoneNumber(recipient),
                new PhoneNumber(fromNumber),
                message
            ).create();
            
            LOG.infof("SMS sent successfully to %s with SID: %s", recipient, twilioMessage.getSid());
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send SMS to %s", recipient);
            throw new RuntimeException("Failed to send SMS", e);
        }
    }
}
