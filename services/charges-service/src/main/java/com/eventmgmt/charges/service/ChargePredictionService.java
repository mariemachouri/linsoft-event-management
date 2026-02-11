package com.eventmgmt.charges.service;

import com.eventmgmt.charges.model.ChargePrediction;
import com.eventmgmt.charges.repository.ChargePredictionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;

@ApplicationScoped
public class ChargePredictionService {
    
    @Inject
    ChargePredictionRepository repository;
    
    @Inject
    AIChargePredictionService aiService;
    
    /**
     * Créer une nouvelle prédiction de charges avec IA
     */
    public ChargePrediction createPrediction(
        String eventId, 
        String organizerId,
        ChargePrediction.EventMetrics eventMetrics
    ) {
        var prediction = new ChargePrediction();
        prediction.eventId = eventId;
        prediction.organizerId = organizerId;
        prediction.eventMetrics = eventMetrics;
        prediction.status = "pending";
        prediction.createdAt = LocalDateTime.now().toString();
        
        // Utiliser l'IA pour prédire les charges
        prediction.predictionResult = aiService.predictCharges(eventMetrics);
        
        // Initialiser la décision de paiement avec les recommandations IA
        prediction.paymentDecision = new ChargePrediction.PaymentDecision();
        java.util.List<String> recommendedMethods = aiService.recommendPaymentMethods(
            eventMetrics, 
            prediction.predictionResult.predictedTotalCost
        );
        
        // Suggérer la première méthode recommandée par défaut
        if (!recommendedMethods.isEmpty()) {
            prediction.paymentDecision.paymentMethod = recommendedMethods.get(0);
        }
        
        repository.persist(prediction);
        return prediction;
    }
    
    /**
     * Mise à jour de la décision de paiement par l'organisateur/admin
     */
    public ChargePrediction updatePaymentDecision(
        String predictionId,
        String paymentMethod,
        String decidedBy,
        String reason
    ) {
        var prediction = repository.findByIdOptional(new ObjectId(predictionId))
            .orElseThrow(() -> new RuntimeException("Prediction not found"));
            
        if (prediction.paymentDecision == null) {
            prediction.paymentDecision = new ChargePrediction.PaymentDecision();
        }
        
        prediction.paymentDecision.paymentMethod = paymentMethod;
        prediction.paymentDecision.decidedBy = decidedBy;
        prediction.paymentDecision.decisionDate = LocalDateTime.now().toString();
        prediction.paymentDecision.reason = reason;
        
        // Déterminer si une approbation est nécessaire
        prediction.paymentDecision.requiresApproval = 
            prediction.predictionResult.predictedTotalCost > 5000.0;
            
        prediction.status = prediction.paymentDecision.requiresApproval ? "pending_approval" : "approved";
        
        repository.update(prediction);
        return prediction;
    }
    
    /**
     * Approuver ou rejeter une prédiction (pour les admins)
     */
    public ChargePrediction approvePrediction(String predictionId, boolean approved, String adminId) {
        var prediction = repository.findByIdOptional(new ObjectId(predictionId))
            .orElseThrow(() -> new RuntimeException("Prediction not found"));
            
        prediction.status = approved ? "approved" : "rejected";
        
        repository.update(prediction);
        return prediction;
    }
    
    /**
     * Lister toutes les prédictions
     */
    public List<ChargePrediction> listAll() {
        return repository.listAll();
    }
    
    /**
     * Trouver par ID
     */
    public Optional<ChargePrediction> findById(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }
    
    /**
     * Trouver par ID d'événement
     */
    public List<ChargePrediction> findByEventId(String eventId) {
        return repository.find("eventId", eventId).list();
    }
    
    /**
     * Trouver par organisateur
     */
    public List<ChargePrediction> findByOrganizerId(String organizerId) {
        return repository.find("organizerId", organizerId).list();
    }
    
    /**
     * Prédictions en attente d'approbation
     */
    public List<ChargePrediction> findPendingApprovals() {
        return repository.find("status", "pending_approval").list();
    }
    
    /**
     * Supprimer une prédiction
     */
    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}