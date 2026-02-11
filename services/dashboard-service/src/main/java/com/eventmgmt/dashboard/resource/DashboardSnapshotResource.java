package com.eventmgmt.dashboard.resource;

import com.eventmgmt.dashboard.model.DashboardSnapshot;
import com.eventmgmt.dashboard.service.DashboardSnapshotService;

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

@Path("/api/dashboard")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DashboardSnapshotResource {
    @Inject
    DashboardSnapshotService service;

    @GET
    public List<DashboardSnapshot> list() {
        return service.list();
    }

    @GET
    @Path("{id}")
    public DashboardSnapshot get(@PathParam("id") String id) {
        return service.get(id).orElseThrow(NotFoundException::new);
    }

    @POST
    public Response create(DashboardSnapshot snapshot) {
        DashboardSnapshot created = service.create(snapshot);
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