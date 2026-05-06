package com.eventmgmt.registrations.resource;

import com.eventmgmt.registrations.model.Registration;
import com.eventmgmt.registrations.service.RegistrationService;
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
import java.util.Map;

@Path("/api/registrations")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RegistrationResource {
    @Inject
    RegistrationService service;

    @GET
    public List<Registration> list() {
        return service.list();
    }

    @GET
    @Path("{id}")
    public Registration get(@PathParam("id") String id) {
        return service.get(id).orElseThrow(NotFoundException::new);
    }

    @POST
    public Response create(Registration registration) {
        Registration created = service.create(registration);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("{id}/status")
    public Response updateStatus(@PathParam("id") String id, Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "status field is required")).build();
        }
        try {
            Registration updated = service.updateStatus(id, newStatus);
            return Response.ok(updated).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    @POST
    @Path("{id}/confirm")
    public Response confirm(@PathParam("id") String id) {
        try {
            Registration confirmed = service.confirmRegistration(id);
            return Response.ok(confirmed).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    @POST
    @Path("{id}/cancel")
    public Response cancel(@PathParam("id") String id) {
        try {
            Registration cancelled = service.cancelRegistration(id);
            return Response.ok(cancelled).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    @DELETE
    @Path("{id}")
    public void delete(@PathParam("id") String id) {
        if (!service.delete(id)) {
            throw new NotFoundException();
        }
    }
}
