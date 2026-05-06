package com.eventmgmt.charges.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "charges")
public class ChargeItem extends PanacheMongoEntity {
    public String eventId;
    public String catalogItemId;   // Référence vers ChargeCatalogItem
    public String predictionId;    // Lien vers ChargePrediction (optionnel)
    public ChargeItemType item;    // Conservé pour compatibilité
    public ChargeCategory category;
    public String description;
    public int quantity = 1;
    public double unitPrice;       // Prix unitaire (du catalogue ou personnalisé)
    public double amount;          // = quantity × unitPrice (calculé)
    public String currency = "EUR";
    public ChargeStatus status = ChargeStatus.PENDING;
    public PaymentInfo paymentInfo;
    public String createdAt;
    public String updatedAt;
    
    // Information de paiement
    public static class PaymentInfo {
        public PaymentMethod method;
        public PaymentStatus status = PaymentStatus.PENDING;
        public String provider; // "stripe", "paypal", "cash", "bank_transfer"
        public boolean isActual; // true = coût réel, false = estimation
        public String paidBy; // User ID
        public String paidAt;
        public String transactionId;
    }
}
