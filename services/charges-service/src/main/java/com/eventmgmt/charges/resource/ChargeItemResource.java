package com.eventmgmt.charges.resource;

import com.eventmgmt.charges.model.ChargeItem;
import com.eventmgmt.charges.model.ChargeStatus;
import com.eventmgmt.charges.service.ChargeItemService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
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
    public List<ChargeItem> list(
            @QueryParam("eventId") String eventId,
            @QueryParam("status") ChargeStatus status) {
        if (eventId != null && status != null) {
            return service.listByEventIdAndStatus(eventId, status);
        } else if (eventId != null) {
            return service.listByEventId(eventId);
        } else if (status != null) {
            return service.listByStatus(status);
        }
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

    @PUT
    @Path("{id}")
    public Response update(@PathParam("id") String id, ChargeItem item) {
        return service.update(id, item)
                .map(updated -> Response.ok(updated).build())
                .orElseThrow(NotFoundException::new);
    }

    @PUT
    @Path("{id}/status")
    public Response updateStatus(@PathParam("id") String id, StatusRequest request) {
        if (request == null || request.status == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("status is required").build();
        }
        return service.updateStatus(id, request.status)
                .map(updated -> Response.ok(updated).build())
                .orElseThrow(NotFoundException::new);
    }

    @DELETE
    @Path("{id}")
    public void delete(@PathParam("id") String id) {
        if (!service.delete(id)) {
            throw new NotFoundException();
        }
    }

    @GET
    @Path("by-event/{eventId}")
    public List<ChargeItem> getByEventId(@PathParam("eventId") String eventId) {
        return service.getByEventId(eventId);
    }

    public static class StatusRequest {
        public ChargeStatus status;
    }
}
