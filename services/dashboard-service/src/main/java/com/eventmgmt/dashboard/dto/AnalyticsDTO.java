package com.eventmgmt.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DTO representing aggregated analytics data for the dashboard.
 * Covers totals, monthly breakdowns, category/status distributions,
 * computed rates, and per-month trend objects.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDTO {

    // ── Totals ────────────────────────────────────────────────────────────────
    private int totalEvents;
    private int totalRegistrations;
    private int totalUsers;
    private int completedEvents;

    // ── Monthly breakdowns (index 0 = January … 11 = December) ───────────────
    @Builder.Default
    private List<Integer> monthlyEvents = new ArrayList<>();

    @Builder.Default
    private List<Integer> monthlyRegistrations = new ArrayList<>();

    @Builder.Default
    private List<Integer> monthlyUsers = new ArrayList<>();

    // ── Distributions ─────────────────────────────────────────────────────────
    /** Event counts keyed by category: CONFERENCE, WORKSHOP, MEETUP, SEMINAR, OTHER */
    @Builder.Default
    private Map<String, Integer> eventsByCategory = new HashMap<>();

    /** Registration counts keyed by status: PENDING, CONFIRMED, CANCELLED */
    @Builder.Default
    private Map<String, Integer> registrationsByStatus = new HashMap<>();

    // ── Computed rates ────────────────────────────────────────────────────────
    /** totalRegistrations / totalEvents (rounded to 2 decimal places) */
    private double registrationRate;

    /** completedEvents / totalEvents (rounded to 2 decimal places) */
    private double completionRate;

    // ── Trend list ────────────────────────────────────────────────────────────
    @Builder.Default
    private List<MonthlyTrend> trends = new ArrayList<>();

    // ── Metadata ──────────────────────────────────────────────────────────────
    /** ISO-8601 timestamp of when this DTO was built */
    private String generatedAt;

    // ─────────────────────────────────────────────────────────────────────────
    // Inner class
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Per-month snapshot used to drive the trend chart on the dashboard.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrend {
        /** Short month label, e.g. "Jan", "Fév", … */
        private String month;
        private int events;
        private int registrations;
        private int users;
    }
}
