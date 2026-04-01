package com.eventmgmt.notifications.sender;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class EmailSender {
    private static final Logger LOG = Logger.getLogger(EmailSender.class);

    @Inject
    Mailer mailer;

    @ConfigProperty(name = "quarkus.mailer.from")
    String fromEmail;

    public void send(String recipient, String subject, String message) {
        try {
            LOG.infof("🔵 [SMTP] Attempting to send email to %s with subject: %s", recipient, subject);
            LOG.infof("🔵 [SMTP] Using SMTP server: %s, From: %s", 
                System.getenv("EMAIL_HOST") != null ? System.getenv("EMAIL_HOST") : "smtp.gmail.com", 
                fromEmail);
            
            mailer.send(
                Mail.withText(recipient, subject, message)
                    .setFrom(fromEmail)
            );
            
            LOG.infof("✅ [SMTP] Email sent successfully to %s", recipient);
        } catch (Exception e) {
            LOG.errorf(e, "❌ [SMTP] Failed to send email to %s - Error: %s", recipient, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }
}
