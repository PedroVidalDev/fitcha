package com.pedro.fitchaadmin.user.dtos;

import com.pedro.fitchaadmin.user.entities.User;

public record UserDTO(String id, String name, String email, String password) {
    public UserDTO(User user) {
        this(user.getId(), user.getName(), user.getEmail(), user.getPassword());
    }
}
