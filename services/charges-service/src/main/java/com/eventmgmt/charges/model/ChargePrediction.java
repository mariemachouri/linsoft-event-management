package com.eventmgmt.charges.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "charge_predictions")
public class ChargePrediction extends PanacheMongoEntity {
    public String eventId;
    public String organizerId;
    public EventMetrics eventMetrics;
    public PredictionResult predictionResult;
    public PaymentDecision paymentDecision;
    public ChargeStatus status;
    public String createdAt;
    
    // Métrique de l'événement pour l'IA
    public static class EventMetrics {
        public int expectedAttendees;
        public EventCategory eventType;
        public int durationHours;
        public String location; // "online", "venue"
        public String city;
        public boolean cateringRequired;
        public boolean equipmentRequired;
        public double venueSize; // en m²
    }
    
    // Résultat de la prédiction IA
    public static class PredictionResult {
        public double predictedTotalCost;
        public double confidenceScore; // 0.0 à 1.0
        public CostBreakdown breakdown;
        public String aiModel; // "linear_regression", "neural_network"
        public java.util.List<String> riskFactors;
        public java.util.List<String> recommendations;
        public java.util.List<ItemRecommendation> itemRecommendations;
    }
    
    // Détail des coûts prédits
    public static class CostBreakdown {
        public double venueCost;
        public double cateringCost;
        public double equipmentCost;
        public double staffingCost;
        public double marketingCost;
        public double insuranceCost;
        public double miscellaneousCost;
    }

    public static class ItemRecommendation {
        public ChargeItemType item;
        public int suggestedQuantity;
        public String reason;
    }
    
    // Décision de paiement par l'organisateur/admin
    public static class PaymentDecision {
        public PaymentMethod paymentMethod;
        public String decidedBy; // User ID
        public String decisionDate;
        public String reason;
        public boolean requiresApproval;
    }
}