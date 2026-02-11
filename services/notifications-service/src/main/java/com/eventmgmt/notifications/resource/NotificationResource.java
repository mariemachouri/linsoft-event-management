package com.eventmgmt.notifications.resource;

import com.eventmgmt.notifications.model.Notification;
import com.eventmgmt.notifications.service.NotificationService;
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

@Path("/api/notifications")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {
    @Inject
    NotificationService service;

    @GET
    public List<Notification> list() {
        return service.list();
    }

    @GET
    @Path("{id}")
    public Notification get(@PathParam("id") String id) {
        return service.get(id).orElseThrow(NotFoundException::new);
    }

    @POST
    public Response create(Notification notification) {
        Notification created = service.create(notification);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @DELETE
    @Path("{id}")
    public void delete(@PathParam("id") String id) {
        if (!service.delete(id)) {
            throw new NotFoundException();
        }
    }
}
