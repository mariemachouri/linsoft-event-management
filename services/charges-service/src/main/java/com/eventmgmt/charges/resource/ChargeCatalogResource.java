package com.eventmgmt.charges.resource;

import com.eventmgmt.charges.model.ChargeCatalogItem;
import com.eventmgmt.charges.service.ChargeCatalogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/charge-catalog")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ChargeCatalogResource {

    @Inject
    ChargeCatalogService service;

    @GET
    public List<ChargeCatalogItem> list(@QueryParam("active") Boolean active) {
        if (Boolean.TRUE.equals(active)) {
            return service.listActive();
        }
        return service.listAll();
    }

    @GET
    @Path("{id}")
    public ChargeCatalogItem get(@PathParam("id") String id) {
        return service.findById(id).orElseThrow(NotFoundException::new);
    }

    @POST
    public Response create(ChargeCatalogItem item) {
        if (item.name == null || item.name.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("name is required").build();
        }
        return Response.status(Response.Status.CREATED).entity(service.create(item)).build();
    }

    @PUT
    @Path("{id}")
    public Response update(@PathParam("id") String id, ChargeCatalogItem item) {
        return service.update(id, item)
                .map(updated -> Response.ok(updated).build())
                .orElseThrow(NotFoundException::new);
    }

    @DELETE
    @Path("{id}")
    public Response delete(@PathParam("id") String id) {
        if (!service.delete(id)) throw new NotFoundException();
        return Response.noContent().build();
    }
}
