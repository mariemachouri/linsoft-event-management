package com.eventmgmt.events.resource;

import com.eventmgmt.events.model.Event;
import com.eventmgmt.events.service.EventService;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/events")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class EventResource {
    @Inject
    EventService service;

    @GET
    public List<Event> list() {
        return service.list();
    }

    @GET
    @Path("{id}")
    public Event get(@PathParam("id") String id) {
        return service.get(id).orElseThrow(NotFoundException::new);
    }

    @POST
    public Response create(Event event) {
        Event created = service.create(event);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("{id}")
    public Event update(@PathParam("id") String id, Event event) {
        return service.update(id, event);
    }

    @DELETE
    @Path("{id}")
    public Response delete(@PathParam("id") String id) {
        try {
            if (!service.delete(id)) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"message\":\"Event not found: " + id + "\"}")
                    .build();
            }
            return Response.noContent().build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("{\"message\":\"Invalid event ID format: " + id + "\"}")
                .build();
        }
    }

    @PUT
    @Path("{id}/charges/{chargeId}")
    public Event addChargeToEvent(@PathParam("id") String eventId, @PathParam("chargeId") String chargeId) {
        return service.addCharge(eventId, chargeId);
    }

    @POST
    @Path("{id}/participants/increment")
    public Response incrementParticipants(@PathParam("id") String id) {
        try {
            service.incrementParticipants(id);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    @POST
    @Path("{id}/participants/decrement")
    public Response decrementParticipants(@PathParam("id") String id) {
        try {
            service.decrementParticipants(id);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }
}
