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

            String html = buildHtmlEmail(subject, message);

            mailer.send(
                Mail.withHtml(recipient, subject, html)
                    .setText(message)   // plain-text fallback
                    .setFrom(fromEmail)
            );

            LOG.infof("✅ [SMTP] Email sent successfully to %s", recipient);
        } catch (Exception e) {
            LOG.errorf(e, "❌ [SMTP] Failed to send email to %s - Error: %s", recipient, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    // ---------------------------------------------------------------
    // HTML email template — LinSoft branding
    // ---------------------------------------------------------------
    private String buildHtmlEmail(String subject, String bodyText) {
        // Convert plain-text line breaks to <br> / paragraphs
        String bodyHtml = bodyText
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\n\n", "</p><p style='margin:0 0 12px 0;'>")
            .replace("\n", "<br/>");

        return "<!DOCTYPE html>" +
            "<html lang='fr'><head><meta charset='UTF-8'/>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'/>" +
            "<title>" + subject + "</title></head>" +
            "<body style='margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;'>" +

            // Wrapper
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f9;padding:40px 0;'>" +
            "<tr><td align='center'>" +
            "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>" +

            // ── Header / Logo LinSoft ──────────────────────────────
            "<tr><td style='background:#ffffff;border-radius:12px 12px 0 0;padding:28px 40px 20px 40px;text-align:center;border:1px solid #e2e8f0;border-bottom:none;'>" +
            // LinSoft logo — CSS replica: red block "LIN" + black "SOFT"
            "<div style='display:inline-block;'>" +
            // Red rounded box with LIN
            "<span style='display:inline-block;background:#cc1f24;border-radius:8px 0 0 8px;" +
            "padding:6px 10px 6px 12px;font-size:28px;font-weight:900;color:#ffffff;" +
            "letter-spacing:1px;font-family:Arial Black,sans-serif;line-height:1;'>LIN</span>" +
            // Black SOFT
            "<span style='display:inline-block;background:#ffffff;border:3px solid #1a1a1a;" +
            "border-left:none;border-radius:0 6px 6px 0;" +
            "padding:6px 12px 6px 10px;font-size:28px;font-weight:900;color:#1a1a1a;" +
            "letter-spacing:1px;font-family:Arial Black,sans-serif;line-height:1;'>SOFT</span>" +
            "</div>" +
            "<p style='color:#6b7280;font-size:10px;margin:6px 0 0 0;letter-spacing:2px;" +
            "text-transform:uppercase;font-family:Arial,sans-serif;'>LEADER IN IT TRAINING &amp; CONSULTING</p>" +
            "</td></tr>" +
            // Divider rouge
            "<tr><td style='background:#cc1f24;height:4px;'></td></tr>" +

            // ── Subject banner ─────────────────────────────────────
            "<tr><td style='background:#1a1a1a;padding:14px 40px;text-align:center;'>" +
            "<span style='color:#fff;font-size:15px;font-weight:600;letter-spacing:0.5px;'>" +
            subject + "</span>" +
            "</td></tr>" +

            // ── Body ───────────────────────────────────────────────
            "<tr><td style='background:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;'>" +
            "<p style='margin:0 0 12px 0;color:#2d3748;font-size:15px;line-height:1.7;'>" +
            bodyHtml + "</p>" +
            "</td></tr>" +

            // ── Footer ─────────────────────────────────────────────
            "<tr><td style='background:#1a1a1a;border-radius:0 0 12px 12px;padding:24px 40px;border:1px solid #333;border-top:none;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'>" +
            "<tr>" +
            "<td style='color:#9ca3af;font-size:12px;line-height:1.8;'>" +
            "<span style='color:#cc1f24;font-weight:900;font-size:14px;" +
            "font-family:Arial Black,sans-serif;letter-spacing:1px;'>LIN</span>" +
            "<span style='color:#ffffff;font-weight:900;font-size:14px;" +
            "font-family:Arial Black,sans-serif;letter-spacing:1px;'>SOFT</span><br/>" +
            "&#9993; &nbsp;<a href='mailto:support@linsoft.tn' style='color:#cc1f24;text-decoration:none;'>support@linsoft.tn</a><br/>" +
            "&#9742; &nbsp;+216 71 000 000<br/>" +
            "&#127760; &nbsp;<a href='http://www.linsoft.tn' style='color:#cc1f24;text-decoration:none;'>www.linsoft.tn</a>" +
            "</td>" +
            "<td align='right' style='color:#6b7280;font-size:11px;vertical-align:bottom;line-height:1.6;'>" +
            "&#169; 2026 LinSoft.<br/>Tous droits r&eacute;serv&eacute;s.<br/>" +
            "<span style='color:#4b5563;'>Ne pas r&eacute;pondre &agrave; cet email.</span>" +
            "</td>" +
            "</tr></table>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>";
    }
}
