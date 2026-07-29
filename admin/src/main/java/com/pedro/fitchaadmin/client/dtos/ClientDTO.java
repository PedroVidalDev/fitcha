package com.pedro.fitchaadmin.client.dtos;

import java.time.Instant;

import com.pedro.fitchaadmin.client.entities.Client;

public record ClientDTO(
        Long id,
        String name,
        String email,
        long credits,
        boolean verified,
        Instant createdAt,
        Instant updatedAt
) {
    public ClientDTO(Client client) {
        this(
                client.getId(),
                client.getName(),
                client.getEmail(),
                client.getCredits(),
                client.isVerified(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }

    public static ClientDTO empty() {
        return new ClientDTO(null, "", "", 0, false, null, null);
    }
}
