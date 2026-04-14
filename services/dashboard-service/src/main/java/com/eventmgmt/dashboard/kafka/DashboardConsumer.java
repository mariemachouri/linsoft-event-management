package com.eventmgmt.dashboard.kafka;

import com.eventmgmt.dashboard.dto.EventMessage;
import com.eventmgmt.dashboard.dto.RegistrationMessage;
import com.eventmgmt.dashboard.dto.UserMessage;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Kafka consumer for aggregating statistics in real-time
 */
@ApplicationScoped
public class DashboardConsumer {
    private static final Logger LOG = Logger.getLogger(DashboardConsumer.class);

    // In-memory counters (in production, use MongoDB or cache)
    private final AtomicInteger totalEvents = new AtomicInteger(0);
    private final AtomicInteger totalRegistrations = new AtomicInteger(0);
    private final AtomicInteger totalUsers = new AtomicInteger(0);

    /**
     * Listen to event creation messages and update dashboard stats
     */
    @Incoming("event-created")
    public void onEventCreated(EventMessage message) {
        try {
            LOG.infof("Dashboard: New event created - %s", message.getTitle());
            totalEvents.incrementAndGet();
            
            // TODO: Update dashboard statistics in MongoDB
            // dashboardService.updateEventStats(message);
            
            LOG.infof("Total events: %d", totalEvents.get());
        } catch (Exception e) {
            LOG.errorf(e, "Error processing event-created for dashboard: %s", message.getEventId());
        }
    }

    /**
     * Listen to event updates
     */
    @Incoming("event-updated")
    public void onEventUpdated(EventMessage message) {
        try {
            LOG.infof("Dashboard: Event updated - %s", message.getTitle());
            
            // TODO: Update specific event statistics
            // dashboardService.updateEventDetails(message);
            
        } catch (Exception e) {
            LOG.errorf(e, "Error processing event-updated for dashboard: %s", message.getEventId());
        }
    }

    /**
     * Listen to registration messages and update stats
     */
    @Incoming("registration-created")
    public void onRegistrationCreated(RegistrationMessage message) {
        try {
            LOG.infof("Dashboard: New registration for event %s", message.getEventId());
            totalRegistrations.incrementAndGet();
            
            // TODO: Update registration statistics per event
            // dashboardService.updateRegistrationStats(message);
            
            LOG.infof("Total registrations: %d", totalRegistrations.get());
        } catch (Exception e) {
            LOG.errorf(e, "Error processing registration-created for dashboard: %s", message.getRegistrationId());
        }
    }

    /**
     * Listen to user creation messages
     */
    @Incoming("user-created")
    public void onUserCreated(UserMessage message) {
        try {
            LOG.infof("Dashboard: New user created - %s", message.getUsername());
            totalUsers.incrementAndGet();
            
            // TODO: Update user statistics
            // dashboardService.updateUserStats(message);
            
            LOG.infof("Total users: %d", totalUsers.get());
        } catch (Exception e) {
            LOG.errorf(e, "Error processing user-created for dashboard: %s", message.getUserId());
        }
    }

    // Public methods to get current stats (for API endpoints)
    public int getTotalEvents() {
        return totalEvents.get();
    }

    public int getTotalRegistrations() {
        return totalRegistrations.get();
    }

    public int getTotalUsers() {
        return totalUsers.get();
    }
}
