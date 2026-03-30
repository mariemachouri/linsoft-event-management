package com.eventmgmt.users.dto;

import com.eventmgmt.users.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class UserUpdateRequest {
    
    @Email(message = "Email must be valid")
    private String email;
    
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;
    
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;
    
    private String phoneNumber;
    
    private Set<UserRole> roles;
    
    private Boolean enabled;
}
