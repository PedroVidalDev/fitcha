package com.pedro.fitchaadmin.client.dtos;

import com.pedro.fitchaadmin.client.entities.Client;

public record ClientDTO(String id, String name, String email, String password) {
    public ClientDTO(Client client) {
        this(client.getId(), client.getName(), client.getEmail(), client.getPassword());
    }
}
