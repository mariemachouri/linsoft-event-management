package com.eventmgmt.users.resource;

import com.eventmgmt.users.dto.UserCreateRequest;
import com.eventmgmt.users.dto.UserResponse;
import com.eventmgmt.users.dto.UserUpdateRequest;
import com.eventmgmt.users.model.UserRole;
import com.eventmgmt.users.service.UserProfileService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
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
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.Set;

@Path("/api/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Users", description = "User management endpoints")
public class UserProfileResource {
    
    @Inject
    UserProfileService service;
    
    @GET
    @RolesAllowed({"admin", "user"})
    @Operation(summary = "Get all users", description = "Retrieve a list of all users")
    @APIResponse(responseCode = "200", description = "Users retrieved successfully")
    public List<UserResponse> getAllUsers() {
        return service.getAllUsers();
    }
    
    @GET
    @Path("/{id}")
    @RolesAllowed({"admin", "user"})
    @Operation(summary = "Get user by ID", description = "Retrieve a specific user by their ID")
    @APIResponse(responseCode = "200", description = "User found")
    @APIResponse(responseCode = "404", description = "User not found")
    public UserResponse getUserById(
            @Parameter(description = "User ID", required = true)
            @PathParam("id") String id) {
        return service.getUserById(id)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }
    
    @GET
    @Path("/username/{username}")
    @RolesAllowed({"admin", "user"})
    @Operation(summary = "Get user by username", description = "Retrieve a specific user by their username")
    @APIResponse(responseCode = "200", description = "User found")
    @APIResponse(responseCode = "404", description = "User not found")
    public UserResponse getUserByUsername(
            @Parameter(description = "Username", required = true)
            @PathParam("username") String username) {
        return service.getUserByUsername(username)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }
    
    @POST
    @RolesAllowed("admin")
    @Operation(summary = "Create user", description = "Create a new user")
    @APIResponse(responseCode = "201", description = "User created successfully")
    @APIResponse(responseCode = "400", description = "Invalid input")
    @APIResponse(responseCode = "409", description = "User already exists")
    public Response createUser(@Valid UserCreateRequest request) {
        UserResponse created = service.createUser(request);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
    
    @PUT
    @Path("/{id}")
    @RolesAllowed("admin")
    @Operation(summary = "Update user", description = "Update an existing user")
    @APIResponse(responseCode = "200", description = "User updated successfully")
    @APIResponse(responseCode = "404", description = "User not found")
    public UserResponse updateUser(
            @Parameter(description = "User ID", required = true)
            @PathParam("id") String id,
            @Valid UserUpdateRequest request) {
        return service.updateUser(id, request);
    }
    
    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    @Operation(summary = "Delete user", description = "Delete a user")
    @APIResponse(responseCode = "204", description = "User deleted successfully")
    @APIResponse(responseCode = "404", description = "User not found")
    public Response deleteUser(
            @Parameter(description = "User ID", required = true)
            @PathParam("id") String id) {
        service.deleteUser(id);
        return Response.noContent().build();
    }
    
    @POST
    @Path("/{id}/roles")
    @RolesAllowed("admin")
    @Operation(summary = "Assign roles to user", description = "Assign roles to a user")
    @APIResponse(responseCode = "200", description = "Roles assigned successfully")
    @APIResponse(responseCode = "404", description = "User not found")
    public Response assignRoles(
            @Parameter(description = "User ID", required = true)
            @PathParam("id") String id,
            Set<UserRole> roleNames) {
        service.assignRolesToUser(id, roleNames);
        return Response.ok().build();
    }
    
    @DELETE
    @Path("/{id}/roles")
    @RolesAllowed("admin")
    @Operation(summary = "Remove roles from user", description = "Remove roles from a user")
    @APIResponse(responseCode = "200", description = "Roles removed successfully")
    @APIResponse(responseCode = "404", description = "User not found")
    public Response removeRoles(
            @Parameter(description = "User ID", required = true)
            @PathParam("id") String id,
            Set<UserRole> roleNames) {
        service.removeRolesFromUser(id, roleNames);
        return Response.ok().build();
    }
}
