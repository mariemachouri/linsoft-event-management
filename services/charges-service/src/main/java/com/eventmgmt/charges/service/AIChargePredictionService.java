package com.eventmgmt.charges.service;

import com.eventmgmt.charges.model.ChargePrediction;
import com.eventmgmt.charges.model.EventCategory;
import com.eventmgmt.charges.model.PaymentMethod;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.*;

@ApplicationScoped
public class AIChargePredictionService {
    
    // Base de données simulée des coûts historiques par type d'événement
    private static final Map<String, Map<String, Double>> HISTORICAL_COSTS = Map.of(
        "conference", Map.of(
            "baseVenueCost", 150.0, "cateringPerPerson", 45.0, "equipmentCost", 800.0,
            "staffingPerHour", 25.0, "marketingBudget", 500.0, "insuranceFlat", 200.0
        ),
        "workshop", Map.of(
            "baseVenueCost", 80.0, "cateringPerPerson", 25.0, "equipmentCost", 400.0,
            "staffingPerHour", 20.0, "marketingBudget", 200.0, "insuranceFlat", 100.0
        ),
        "meetup", Map.of(
            "baseVenueCost", 50.0, "cateringPerPerson", 15.0, "equipmentCost", 200.0,
            "staffingPerHour", 15.0, "marketingBudget", 100.0, "insuranceFlat", 50.0
        ),
        "seminar", Map.of(
            "baseVenueCost", 100.0, "cateringPerPerson", 35.0, "equipmentCost", 600.0,
            "staffingPerHour", 22.0, "marketingBudget", 300.0, "insuranceFlat", 150.0
        )
    );
    
    private static final Map<String, Double> CITY_MULTIPLIERS = Map.of(
        "Paris", 1.4, "Lyon", 1.2, "Marseille", 1.1, "Toulouse", 1.0,
        "Nice", 1.3, "Nantes", 1.1, "Strasbourg", 1.15, "Bordeaux", 1.1
    );
    
    /**
     * Prédiction IA des charges d'événement avec modèle de régression simulé
     */
    public ChargePrediction.PredictionResult predictCharges(ChargePrediction.EventMetrics metrics) {
        var result = new ChargePrediction.PredictionResult();
        
        // Obtenir les coûts de base pour le type d'événement
        Map<String, Double> baseCosts = HISTORICAL_COSTS.getOrDefault(
            metrics.eventType.name().toLowerCase(), HISTORICAL_COSTS.get("meetup")
        );
        
        // Multiplicateur de ville
        double cityMultiplier = CITY_MULTIPLIERS.getOrDefault(metrics.city, 1.0);
        
        // Calcul sophistiqué avec algorithme de ML simulé
        var breakdown = calculateCostBreakdown(metrics, baseCosts, cityMultiplier);
        result.breakdown = breakdown;
        
        // Calcul du coût total prédit
        result.predictedTotalCost = 
            breakdown.venueCost + breakdown.cateringCost + breakdown.equipmentCost +
            breakdown.staffingCost + breakdown.marketingCost + breakdown.insuranceCost +
            breakdown.miscellaneousCost;
            
        // Simulation du score de confiance basé sur la qualité des données
        result.confidenceScore = calculateConfidenceScore(metrics);
        
        // Modèle IA utilisé (simulé)
        result.aiModel = metrics.expectedAttendees > 100 ? "neural_network" : "linear_regression";
        
        // Analyse des facteurs de risque
        result.riskFactors = analyzeRiskFactors(metrics, result.predictedTotalCost);
        
        // Recommandations IA
        result.recommendations = generateRecommendations(metrics, breakdown);

        // Articles recommandés basés sur le type d'événement
        result.itemRecommendations = generateItemRecommendations(metrics);
        
        return result;
    }
    
    private ChargePrediction.CostBreakdown calculateCostBreakdown(
        ChargePrediction.EventMetrics metrics, 
        Map<String, Double> baseCosts, 
        double cityMultiplier
    ) {
        var breakdown = new ChargePrediction.CostBreakdown();
        
        // Venue Cost - facteur taille et lieu
        double venueCostPerM2 = baseCosts.get("baseVenueCost") * cityMultiplier;
        double[] venueSizeRange = calculateVenueSizeRange(metrics.expectedAttendees, metrics.eventType);
        breakdown.venueCost = venueCostPerM2 * venueSizeRange[0] * metrics.durationHours;
        
        // Catering Cost - si requis
        if (metrics.cateringRequired) {
            double cateringPerPerson = baseCosts.get("cateringPerPerson") * cityMultiplier;
            breakdown.cateringCost = cateringPerPerson * metrics.expectedAttendees * 
                (metrics.durationHours > 4 ? 1.5 : 1.0);
        }
        
        // Equipment Cost - si requis
        if (metrics.equipmentRequired) {
            breakdown.equipmentCost = baseCosts.get("equipmentCost") * cityMultiplier *
                (metrics.location.equals("online") ? 0.3 : 1.0);
        }
        
        // Staffing Cost
        double staffingHours = metrics.durationHours * (metrics.expectedAttendees / 50.0);
        breakdown.staffingCost = baseCosts.get("staffingPerHour") * staffingHours * cityMultiplier;
        
        // Marketing Cost - basé sur l'audience
        breakdown.marketingCost = baseCosts.get("marketingBudget") * 
            Math.log(metrics.expectedAttendees + 1) / Math.log(100);
            
        // Insurance
        breakdown.insuranceCost = baseCosts.get("insuranceFlat") * cityMultiplier;
        
        // Miscellaneous (10% du total)
        double subtotal = breakdown.venueCost + breakdown.cateringCost + breakdown.equipmentCost +
                         breakdown.staffingCost + breakdown.marketingCost + breakdown.insuranceCost;
        breakdown.miscellaneousCost = subtotal * 0.1;
        
        return breakdown;
    }
    
    private double[] calculateVenueSizeRange(int attendees, EventCategory eventType) {
        double baseSpace = switch (eventType) {
            case CONFERENCE -> 3.0; // m² par personne
            case WORKSHOP -> 4.0;
            case MEETUP -> 2.0;
            case SEMINAR -> 3.5;
        };
        
        double totalSpace = attendees * baseSpace;
        return new double[]{totalSpace, totalSpace * 1.2}; // min, max
    }
    
    private double calculateConfidenceScore(ChargePrediction.EventMetrics metrics) {
        double score = 0.7; // Base score
        
        // Facteurs d'amélioration de confiance
        if (metrics.expectedAttendees > 0 && metrics.expectedAttendees < 1000) score += 0.1;
        if (metrics.durationHours > 0 && metrics.durationHours < 24) score += 0.1;
        if (metrics.city != null && CITY_MULTIPLIERS.containsKey(metrics.city)) score += 0.1;
        
        return Math.min(0.95, score); // Max 95% de confiance
    }
    
    private java.util.List<String> analyzeRiskFactors(ChargePrediction.EventMetrics metrics, double totalCost) {
        List<String> risks = new ArrayList<>();
        
        if (metrics.expectedAttendees > 500) {
            risks.add("Large event - higher coordination complexity");
        }
        if (totalCost > 10000) {
            risks.add("High budget - require additional approvals");
        }
        if (metrics.location.equals("outdoor")) {
            risks.add("Weather dependency - consider backup options");
        }
        if (metrics.eventType == EventCategory.CONFERENCE && metrics.durationHours > 8) {
            risks.add("Extended duration - fatigue and additional staffing costs");
        }
        
        return risks;
    }
    
    private java.util.List<String> generateRecommendations(
        ChargePrediction.EventMetrics metrics, 
        ChargePrediction.CostBreakdown breakdown
    ) {
        List<String> recommendations = new ArrayList<>();
        
        // Recommandations de paiement
        if (breakdown.venueCost > 2000) {
            recommendations.add("Consider hybrid payment: 50% online pre-booking, 50% onsite");
        } else {
            recommendations.add("Online payment recommended for better cash flow management");
        }
        
        // Optimisations de coût
        if (breakdown.cateringCost > breakdown.venueCost) {
            recommendations.add("Catering represents high cost - evaluate local partnership options");
        }
        
        if (metrics.expectedAttendees < 30) {
            recommendations.add("Small event - consider co-working spaces to reduce venue costs");
        }
        
        if (metrics.equipmentRequired && breakdown.equipmentCost > 1000) {
            recommendations.add("Equipment costs are significant - evaluate rental vs purchase");
        }
        
        return recommendations;
    }
    
    /**
     * Génère des suggestions de méthodes de paiement basées sur l'analyse IA
     */
    public java.util.List<PaymentMethod> recommendPaymentMethods(ChargePrediction.EventMetrics metrics, double predictedCost) {
        List<PaymentMethod> methods = new ArrayList<>();
        
        if (predictedCost < 1000) {
            methods.add(PaymentMethod.ONLINE); // Simple et efficace pour petits budgets
        } else if (predictedCost < 5000) {
            methods.add(PaymentMethod.HYBRID); // Flexibilité pour montants moyens
            methods.add(PaymentMethod.ONLINE);
        } else {
            methods.add(PaymentMethod.HYBRID); // Nécessaire pour gros budgets
            methods.add(PaymentMethod.ONSITE); // Options pour paiements échelonnés
        }
        
        return methods;
    }

    /**
     * Génère des recommandations d'articles basées sur le type d'événement
     */
    private java.util.List<ChargePrediction.ItemRecommendation> generateItemRecommendations(
            ChargePrediction.EventMetrics metrics) {
        List<ChargePrediction.ItemRecommendation> items = new ArrayList<>();

        // Projecteur toujours recommandé sauf événement en ligne
        if (!metrics.location.equals("online")) {
            var proj = new ChargePrediction.ItemRecommendation();
            proj.item = com.eventmgmt.charges.model.ChargeItemType.PROJECTEUR;
            proj.suggestedQuantity = Math.max(1, metrics.expectedAttendees / 100);
            proj.reason = "Required for presentations";
            items.add(proj);
        }

        // Microphones selon taille
        var mic = new ChargePrediction.ItemRecommendation();
        mic.item = com.eventmgmt.charges.model.ChargeItemType.MICROPHONE;
        mic.suggestedQuantity = metrics.expectedAttendees > 50 ? 3 : 1;
        mic.reason = "Essential for audience Q&A";
        items.add(mic);

        // Tables & chaises selon taille
        var table = new ChargePrediction.ItemRecommendation();
        table.item = com.eventmgmt.charges.model.ChargeItemType.TABLE;
        table.suggestedQuantity = (int) Math.ceil(metrics.expectedAttendees / 6.0);
        table.reason = "Seating arrangement";
        items.add(table);

        var chaise = new ChargePrediction.ItemRecommendation();
        chaise.item = com.eventmgmt.charges.model.ChargeItemType.CHAISE;
        chaise.suggestedQuantity = (int) Math.ceil(metrics.expectedAttendees * 1.1);
        chaise.reason = "Seats for all attendees + 10% buffer";
        items.add(chaise);

        // PC portable pour workshops
        if (metrics.eventType == EventCategory.WORKSHOP) {
            var pc = new ChargePrediction.ItemRecommendation();
            pc.item = com.eventmgmt.charges.model.ChargeItemType.PC_PORTABLE;
            pc.suggestedQuantity = Math.min(metrics.expectedAttendees, 30);
            pc.reason = "Hands-on workshop requires individual workstations";
            items.add(pc);
        }

        // Câbles HDMI
        var hdmi = new ChargePrediction.ItemRecommendation();
        hdmi.item = com.eventmgmt.charges.model.ChargeItemType.CABLE_HDMI;
        hdmi.suggestedQuantity = items.stream()
                .filter(i -> i.item == com.eventmgmt.charges.model.ChargeItemType.PROJECTEUR)
                .mapToInt(i -> i.suggestedQuantity * 2).sum() + 2;
        hdmi.reason = "One per projector + spares";
        items.add(hdmi);

        return items;
    }
}