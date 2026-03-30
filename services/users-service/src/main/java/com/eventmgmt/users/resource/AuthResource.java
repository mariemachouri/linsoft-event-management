package com.eventmgmt.users.resource;

import com.eventmgmt.users.dto.LoginRequest;
import com.eventmgmt.users.dto.LoginResponse;
import com.eventmgmt.users.service.AuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthResource {
    
    @Inject
    AuthService authService;
    
    @POST
    @Path("/login")
    @Operation(summary = "User login", description = "Authenticate a user and return JWT tokens")
    @APIResponse(responseCode = "200", description = "Login successful")
    @APIResponse(responseCode = "401", description = "Invalid credentials")
    public Response login(@Valid LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("Invalid credentials"))
                .build();
        }
    }
    
    @POST
    @Path("/refresh")
    @Operation(summary = "Refresh token", description = "Refresh an access token using a refresh token")
    @APIResponse(responseCode = "200", description = "Token refreshed successfully")
    @APIResponse(responseCode = "401", description = "Invalid refresh token")
    public Response refreshToken(RefreshTokenRequest request) {
        try {
            LoginResponse response = authService.refreshToken(request.getRefreshToken());
            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("Invalid refresh token"))
                .build();
        }
    }
    
    public static class RefreshTokenRequest {
        private String refreshToken;
        
        public String getRefreshToken() {
            return refreshToken;
        }
        
        public void setRefreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
        }
    }
    
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
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
