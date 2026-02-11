package com.eventmgmt.charges.resource;

import com.eventmgmt.charges.model.ChargeItem;
import com.eventmgmt.charges.service.ChargeItemService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/charges")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ChargeItemResource {
    @Inject
    ChargeItemService service;

    @GET
    public List<ChargeItem> list() {
        return service.list();
    }

    @GET
    @Path("{id}")
    public ChargeItem get(@PathParam("id") String id) {
        return service.get(id).orElseThrow(NotFoundException::new);
    }

    @POST
    public Response create(ChargeItem item) {
        ChargeItem created = service.create(item);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @DELETE
    @Path("{id}")
    public void delete(@PathParam("id") String id) {
        if (!service.delete(id)) {
            throw new NotFoundException();
        }
    }
    
    /**
     * Récupérer les charges par event ID
     */
    @GET
    @Path("by-event/{eventId}")
    public List<ChargeItem> getByEventId(@PathParam("eventId") String eventId) {
        return service.getByEventId(eventId);
    }
}
