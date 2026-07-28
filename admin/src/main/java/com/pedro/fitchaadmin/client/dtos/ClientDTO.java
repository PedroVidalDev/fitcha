package com.pedro.fitchaadmin.client.dtos;

import com.pedro.fitchaadmin.client.entities.Client;

public record ClientDTO(Long id, String name, String email) {
    public ClientDTO(Client client) {
        this(client.getId(), client.getName(), client.getEmail());
    }
}
