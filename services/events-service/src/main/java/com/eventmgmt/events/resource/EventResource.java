package com.eventmgmt.events.resource;

import com.eventmgmt.events.model.Event;
import com.eventmgmt.events.service.EventService;
import jakarta.inject.Inject;
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
    public void delete(@PathParam("id") String id) {
        if (!service.delete(id)) {
            throw new NotFoundException();
        }
    }

    @PUT
    @Path("{id}/charges/{chargeId}")
    public Event addChargeToEvent(@PathParam("id") String eventId, @PathParam("chargeId") String chargeId) {
        return service.addCharge(eventId, chargeId);
    }
}
