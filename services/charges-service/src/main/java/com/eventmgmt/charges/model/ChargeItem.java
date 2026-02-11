package com.eventmgmt.charges.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "charges")
public class ChargeItem extends PanacheMongoEntity {
    public String eventId;
    public String predictionId; // Lien vers ChargePrediction
    public String category; // "venue", "catering", "equipment", "staffing", "marketing", "insurance", "miscellaneous"
    public String description;
    public double amount;
    public String currency;
    public String status; // "estimated", "confirmed", "paid", "pending"
    public PaymentInfo paymentInfo;
    public String createdAt;
    public String updatedAt;
    
    // Information de paiement
    public static class PaymentInfo {
        public String method; // "online", "onsite", "hybrid"
        public String provider; // "stripe", "paypal", "cash", "bank_transfer"
        public boolean isActual; // true = coût réel, false = estimation
        public String paidBy; // User ID
        public String paidAt;
        public String transactionId;
    }
}
