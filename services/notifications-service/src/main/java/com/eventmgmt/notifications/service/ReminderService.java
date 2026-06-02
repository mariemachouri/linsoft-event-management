package com.eventmgmt.notifications.service;

import com.eventmgmt.notifications.model.EventInfo;
import com.eventmgmt.notifications.model.EventReminder;
import com.eventmgmt.notifications.model.Notification;
import com.eventmgmt.notifications.model.NotificationType;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

/**
 * Envoi automatique des rappels avant événement : J-10, J-5, J-3, J-2, J-1 et Jour-J.
 * Tourne toutes les heures ; la liste remindersSent évite tout doublon.
 */
@ApplicationScoped
public class ReminderService {
    private static final Logger LOG = Logger.getLogger(ReminderService.class);

    /** Paliers de rappel en jours avant l'événement. */
    private static final int[] THRESHOLDS = {10, 5, 3, 2, 1, 0};

    private static final ZoneId ZONE = ZoneId.of("Europe/Paris");
    private static final DateTimeFormatter FR_DATE = DateTimeFormatter
            .ofPattern("EEEE d MMMM yyyy 'à' HH:mm", Locale.FRENCH)
            .withZone(ZONE);

    @Inject
    NotificationService notificationService;

    /**
     * Vérifie chaque heure les événements à venir et envoie les rappels dus.
     * (Exécution horaire = réactif, et remindersSent empêche les doublons.)
     */
    @Scheduled(every = "1h", delayed = "30s")
    void checkAndSendReminders() {
        List<EventReminder> subs = EventReminder.listAll();
        if (subs.isEmpty()) return;

        LOG.infof("⏰ Vérification des rappels : %d abonnement(s)", subs.size());
        int sent = 0;

        for (EventReminder sub : subs) {
            EventInfo info = EventInfo.find("eventId", sub.eventId).firstResult();
            if (info == null || info.startDate == null) continue;

            Instant start = parseToInstant(info.startDate);
            if (start == null) continue;

            long days = ChronoUnit.DAYS.between(Instant.now(), start);
            if (days < 0) continue; // événement passé

            for (int t : THRESHOLDS) {
                if (days == t && !sub.remindersSent.contains(t)) {
                    sendReminder(sub, info, t, start);
                    sub.remindersSent.add(t);
                    sub.update();
                    sent++;
                }
            }
        }
        if (sent > 0) LOG.infof("⏰ %d rappel(s) envoyé(s)", sent);
    }

    private void sendReminder(EventReminder sub, EventInfo info, int daysBefore, Instant start) {
        String dateStr = FR_DATE.format(start);
        String title   = info.title != null ? info.title : "votre événement";
        String name    = (sub.name != null && !sub.name.isBlank()) ? sub.name : "";
        String lieu    = info.location != null ? info.location : "—";

        String intro;
        if (daysBefore == 0) {
            intro = "C'est aujourd'hui ! 🎉 L'événement « " + title + " » a lieu aujourd'hui.";
        } else if (daysBefore == 1) {
            intro = "Plus que 1 jour ! ⏳ L'événement « " + title + " » a lieu demain.";
        } else {
            intro = "Plus que " + daysBefore + " jours avant « " + title + " » ! ⏳";
        }

        // Section lien Google Meet si événement en ligne
        String meetSection = "";
        if (Boolean.TRUE.equals(info.isOnline) && info.meetingLink != null && !info.meetingLink.isBlank()) {
            meetSection = "\n🔗 Événement EN LIGNE — lien de connexion (Google Meet) :\n"
                        + "   " + info.meetingLink + "\n";
        }

        String body = String.format(
            "Bonjour %s,\n\n" +
            "%s\n\n" +
            "  • Événement : %s\n" +
            "  • Date      : %s\n" +
            "  • Lieu      : %s\n" +
            "%s\n" +
            "Nous avons hâte de vous y voir !\n\n" +
            "Cordialement,\nL'équipe Event Management",
            name, intro, title, dateStr, lieu, meetSection
        );

        // Email
        Notification mail = new Notification();
        mail.recipientId = sub.email;
        mail.type = NotificationType.EMAIL;
        mail.message = body;
        notificationService.create(mail);

        // SMS éventuel
        if (sub.phone != null && !sub.phone.isBlank()) {
            String sms = (daysBefore == 0)
                ? String.format("Rappel : « %s » a lieu AUJOURD'HUI (%s) !", title, dateStr)
                : String.format("Rappel : « %s » dans %d jour(s), le %s.", title, daysBefore, dateStr);
            Notification s = new Notification();
            s.recipientId = sub.phone.startsWith("+") ? sub.phone : "+" + sub.phone;
            s.type = NotificationType.SMS;
            s.message = sms;
            notificationService.create(s);
        }

        LOG.infof("⏰ Rappel J-%d envoyé → %s (event=%s)", daysBefore, sub.email, sub.eventId);
    }

    /** Parse une date ISO en Instant, tolérant à plusieurs formats. */
    private Instant parseToInstant(String iso) {
        if (iso == null || iso.isBlank()) return null;
        // 1) Instant complet ("2026-06-01T09:00:00Z")
        try { return Instant.parse(iso); } catch (Exception ignored) {}
        // 2) LocalDateTime ("2026-06-01T09:00" / "2026-06-01T09:00:00")
        try { return LocalDateTime.parse(iso).atZone(ZONE).toInstant(); } catch (Exception ignored) {}
        // 3) OffsetDateTime ("2026-06-01T09:00:00+02:00")
        try { return OffsetDateTime.parse(iso).toInstant(); } catch (Exception ignored) {}
        // 4) LocalDate ("2026-06-01") → 09:00 par défaut
        try { return LocalDate.parse(iso).atTime(9, 0).atZone(ZONE).toInstant(); } catch (Exception ignored) {}
        LOG.warnf("Format de date non reconnu pour rappel : %s", iso);
        return null;
    }
}
