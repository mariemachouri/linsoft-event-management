package com.eventmgmt.notifications.sender;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;
import java.time.Duration;

@ApplicationScoped
public class SmsSender {
    private static final Logger LOG = Logger.getLogger(SmsSender.class);

    private static final String SANDBOX_URL    = "https://api.sandbox.africastalking.com/version1/messaging";
    private static final String PRODUCTION_URL = "https://api.africastalking.com/version1/messaging";

    @ConfigProperty(name = "africastalking.username", defaultValue = "sandbox")
    String username;

    @ConfigProperty(name = "africastalking.api.key", defaultValue = "none")
    String apiKey;

    @ConfigProperty(name = "africastalking.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "africastalking.sandbox", defaultValue = "true")
    boolean sandbox;

    private final HttpClient httpClient = buildHttpClient();

    private static HttpClient buildHttpClient() {
        try {
            // Trust-all SSL context — bypasses cert validation AND forces TLSv1.2
            // (needed for Docker/WSL2 where TLS 1.3 handshake fails through network proxies)
            TrustManager[] trustAll = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };
            SSLContext sslContext = SSLContext.getInstance("TLSv1.2");
            sslContext.init(null, trustAll, new java.security.SecureRandom());
            return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .version(java.net.http.HttpClient.Version.HTTP_1_1)
                .sslContext(sslContext)
                .build();
        } catch (Exception e) {
            return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .version(java.net.http.HttpClient.Version.HTTP_1_1)
                .build();
        }
    }

    public void send(String recipient, String message) {
        if (!enabled) {
            LOG.infof("[SMS-SIMULATION] To: %s | Message: %s", recipient, message);
            return;
        }

        // Normalize phone number
        String phone = recipient.startsWith("+") ? recipient : "+" + recipient;
        String apiUrl = sandbox ? SANDBOX_URL : PRODUCTION_URL;

        try {
            LOG.infof("Sending SMS via Africa's Talking (%s) to %s",
                sandbox ? "sandbox" : "production", phone);

            String body = "username=" + encode(username)
                + "&to=" + encode(phone)
                + "&message=" + encode(message);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(15))
                .header("apiKey", apiKey)
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 201 || response.statusCode() == 200) {
                LOG.infof("✅ SMS sent to %s | Response: %s", phone, response.body());
            } else {
                LOG.errorf("SMS failed — HTTP %d | %s", response.statusCode(), response.body());
                throw new RuntimeException("Africa's Talking returned HTTP " + response.statusCode());
            }

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send SMS to %s", phone);
            throw new RuntimeException("Failed to send SMS via Africa's Talking", e);
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
