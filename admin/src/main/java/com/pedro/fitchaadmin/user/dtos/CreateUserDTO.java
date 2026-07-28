package com.pedro.fitchaadmin.user.dtos;

import com.pedro.fitchaadmin.user.enums.UserRole;

public record CreateUserDTO(String name, String email, String password, UserRole role) {
    
}
