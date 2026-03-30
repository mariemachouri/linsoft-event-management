package com.eventmgmt.users.resource;

import com.eventmgmt.users.dto.RoleRequest;
import com.eventmgmt.users.service.KeycloakRoleService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.keycloak.representations.idm.RoleRepresentation;

import java.util.List;

@Path("/api/roles")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Roles", description = "Role management endpoints")
public class RoleResource {
    
    @Inject
    KeycloakRoleService roleService;
    
    @GET
    @RolesAllowed("admin")
    @Operation(summary = "Get all roles", description = "Retrieve a list of all available roles")
    @APIResponse(responseCode = "200", description = "Roles retrieved successfully")
    public List<RoleRepresentation> getAllRoles() {
        return roleService.getAllRoles();
    }
    
    @GET
    @Path("/{name}")
    @RolesAllowed("admin")
    @Operation(summary = "Get role by name", description = "Retrieve a specific role by name")
    @APIResponse(responseCode = "200", description = "Role found")
    @APIResponse(responseCode = "404", description = "Role not found")
    public Response getRoleByName(
            @Parameter(description = "Role name", required = true)
            @PathParam("name") String name) {
        RoleRepresentation role = roleService.getRoleByName(name);
        if (role == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorMessage("Role not found"))
                .build();
        }
        return Response.ok(role).build();
    }
    
    @POST
    @RolesAllowed("admin")
    @Operation(summary = "Create role", description = "Create a new role")
    @APIResponse(responseCode = "201", description = "Role created successfully")
    @APIResponse(responseCode = "400", description = "Invalid input")
    public Response createRole(@Valid RoleRequest request) {
        roleService.createRole(request.getName(), request.getDescription());
        return Response.status(Response.Status.CREATED).build();
    }
    
    @PUT
    @Path("/{name}")
    @RolesAllowed("admin")
    @Operation(summary = "Update role", description = "Update an existing role")
    @APIResponse(responseCode = "200", description = "Role updated successfully")
    @APIResponse(responseCode = "404", description = "Role not found")
    public Response updateRole(
            @Parameter(description = "Current role name", required = true)
            @PathParam("name") String currentName,
            @Valid RoleRequest request) {
        roleService.updateRole(currentName, request.getName(), request.getDescription());
        return Response.ok().build();
    }
    
    @DELETE
    @Path("/{name}")
    @RolesAllowed("admin")
    @Operation(summary = "Delete role", description = "Delete a role")
    @APIResponse(responseCode = "204", description = "Role deleted successfully")
    @APIResponse(responseCode = "404", description = "Role not found")
    public Response deleteRole(
            @Parameter(description = "Role name", required = true)
            @PathParam("name") String name) {
        roleService.deleteRole(name);
        return Response.noContent().build();
    }
    
    public static class ErrorMessage {
        private String message;
        
        public ErrorMessage(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}
