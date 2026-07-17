package com.eventmgmt.notifications.sender;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@ApplicationScoped
public class SmsSender {
    private static final Logger LOG = Logger.getLogger(SmsSender.class);

    // ── Twilio ──────────────────────────────────────────────────────────────
    @ConfigProperty(name = "twilio.account.sid", defaultValue = "none")
    String twilioAccountSid;

    @ConfigProperty(name = "twilio.auth.token", defaultValue = "none")
    String twilioAuthToken;

    @ConfigProperty(name = "twilio.from.number", defaultValue = "none")
    String twilioFromNumber;

    @ConfigProperty(name = "twilio.enabled", defaultValue = "false")
    boolean twilioEnabled;

    // ── Africa's Talking (fallback) ─────────────────────────────────────────
    @ConfigProperty(name = "africastalking.enabled", defaultValue = "false")
    boolean atEnabled;

    @ConfigProperty(name = "africastalking.username", defaultValue = "sandbox")
    String atUsername;

    @ConfigProperty(name = "africastalking.api.key", defaultValue = "none")
    String atApiKey;

    @ConfigProperty(name = "africastalking.sandbox", defaultValue = "true")
    boolean atSandbox;

    private static final String AT_SANDBOX_URL    = "https://api.sandbox.africastalking.com/version1/messaging";
    private static final String AT_PRODUCTION_URL = "https://api.africastalking.com/version1/messaging";

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .version(HttpClient.Version.HTTP_1_1)
        .build();

    public void send(String recipient, String message) {
        String phone = recipient.startsWith("+") ? recipient : "+" + recipient;

        if (twilioEnabled) {
            sendViaTwilio(phone, message);
        } else if (atEnabled) {
            sendViaAfricasTalking(phone, message);
        } else {
            LOG.infof("[SMS-SIMULATION] To: %s | Message: %s", phone, message);
        }
    }

    // ── Twilio ──────────────────────────────────────────────────────────────
    private void sendViaTwilio(String to, String message) {
        String url = "http://api.twilio.com/2010-04-01/Accounts/"
            + twilioAccountSid + "/Messages.json";

        String credentials = Base64.getEncoder().encodeToString(
            (twilioAccountSid + ":" + twilioAuthToken).getBytes(StandardCharsets.UTF_8));

        String body = "From=" + encode(twilioFromNumber)
            + "&To=" + encode(to)
            + "&Body=" + encode(message);

        try {
            LOG.infof("Sending SMS via Twilio to %s", to);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Basic " + credentials)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 201) {
                LOG.infof("✅ [TWILIO] SMS sent to %s", to);
            } else {
                LOG.errorf("❌ [TWILIO] HTTP %d | %s", response.statusCode(), response.body());
                throw new RuntimeException("Twilio returned HTTP " + response.statusCode());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send SMS via Twilio to %s", to);
            throw new RuntimeException("Failed to send SMS via Twilio", e);
        }
    }

    // ── Africa's Talking ────────────────────────────────────────────────────
    private void sendViaAfricasTalking(String to, String message) {
        String apiUrl = atSandbox ? AT_SANDBOX_URL : AT_PRODUCTION_URL;

        String body = "username=" + encode(atUsername)
            + "&to=" + encode(to)
            + "&message=" + encode(message);

        try {
            LOG.infof("Sending SMS via Africa's Talking (%s) to %s",
                atSandbox ? "sandbox" : "production", to);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(15))
                .header("apiKey", atApiKey)
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 201 || response.statusCode() == 200) {
                LOG.infof("✅ [AT] SMS sent to %s", to);
            } else {
                LOG.errorf("❌ [AT] HTTP %d | %s", response.statusCode(), response.body());
                throw new RuntimeException("Africa's Talking returned HTTP " + response.statusCode());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send SMS via Africa's Talking to %s", to);
            throw new RuntimeException("Failed to send SMS via Africa's Talking", e);
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
