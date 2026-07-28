package com.pedro.fitchaadmin.user.dtos;

import com.pedro.fitchaadmin.user.entities.User;
import com.pedro.fitchaadmin.user.enums.UserRole;

public record UserDTO(String id, String name, String email, UserRole role, boolean active) {
    public UserDTO(User user) {
        this(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive());
    }
}
