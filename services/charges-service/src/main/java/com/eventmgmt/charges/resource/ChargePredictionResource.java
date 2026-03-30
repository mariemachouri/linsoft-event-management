package com.eventmgmt.charges.resource;

import com.eventmgmt.charges.model.ChargePrediction;
import com.eventmgmt.charges.model.PaymentMethod;
import com.eventmgmt.charges.service.ChargePredictionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/charge-predictions")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ChargePredictionResource {
    
    @Inject
    ChargePredictionService service;
    
    /**
     * Lister toutes les prédictions
     */
    @GET
    public List<ChargePrediction> listAll() {
        return service.listAll();
    }
    
    /**
     * Récupérer une prédiction par ID
     */
    @GET
    @Path("{id}")
    public ChargePrediction get(@PathParam("id") String id) {
        return service.findById(id).orElseThrow(NotFoundException::new);
    }
    
    /**
     * Créer une nouvelle prédiction de charges avec IA
     */
    @POST
    @Path("predict")
    public Response createPrediction(PredictionRequest request) {
        if (request.eventId == null || request.organizerId == null || request.eventMetrics == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("eventId, organizerId et eventMetrics sont requis").build();
        }
        
        ChargePrediction prediction = service.createPrediction(
            request.eventId,
            request.organizerId, 
            request.eventMetrics
        );
        
        return Response.status(Response.Status.CREATED).entity(prediction).build();
    }
    
    /**
     * Mise à jour de la décision de paiement par l'organisateur
     */
    @PUT
    @Path("{id}/payment-decision")
    public Response updatePaymentDecision(
        @PathParam("id") String predictionId,
        PaymentDecisionRequest request
    ) {
        if (request.paymentMethod == null || request.decidedBy == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("paymentMethod et decidedBy sont requis").build();
        }
        
        ChargePrediction updated = service.updatePaymentDecision(
            predictionId,
            request.paymentMethod,
            request.decidedBy,
            request.reason
        );
        
        return Response.ok(updated).build();
    }
    
    /**
     * Approbation/Rejet par un admin
     */
    @PUT
    @Path("{id}/approval")
    public Response approvePrediction(
        @PathParam("id") String predictionId,
        ApprovalRequest request
    ) {
        if (request.adminId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("adminId est requis").build();
        }
        
        ChargePrediction approved = service.approvePrediction(
            predictionId,
            request.approved,
            request.adminId
        );
        
        return Response.ok(approved).build();
    }
    
    /**
     * Trouver prédictions par événement
     */
    @GET
    @Path("by-event/{eventId}")
    public List<ChargePrediction> findByEventId(@PathParam("eventId") String eventId) {
        return service.findByEventId(eventId);
    }
    
    /**
     * Trouver prédictions par organisateur
     */
    @GET
    @Path("by-organizer/{organizerId}")
    public List<ChargePrediction> findByOrganizerId(@PathParam("organizerId") String organizerId) {
        return service.findByOrganizerId(organizerId);
    }
    
    /**
     * Prédictions en attente d'approbation (pour admins)
     */
    @GET
    @Path("pending-approvals")
    public List<ChargePrediction> findPendingApprovals() {
        return service.findPendingApprovals();
    }
    
    /**
     * Supprimer une prédiction
     */
    @DELETE
    @Path("{id}")
    public Response delete(@PathParam("id") String id) {
        boolean deleted = service.delete(id);
        if (!deleted) {
            throw new NotFoundException("Prédiction non trouvée");
        }
        return Response.noContent().build();
    }
    
    // DTOs pour les requêtes
    public static class PredictionRequest {
        public String eventId;
        public String organizerId;
        public ChargePrediction.EventMetrics eventMetrics;
    }
    
    public static class PaymentDecisionRequest {
        public PaymentMethod paymentMethod;
        public String decidedBy; // User ID
        public String reason;
    }
    
    public static class ApprovalRequest {
        public boolean approved;
        public String adminId;
    }
}