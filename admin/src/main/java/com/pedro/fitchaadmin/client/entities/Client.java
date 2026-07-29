package com.pedro.fitchaadmin.client.entities;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.pedro.fitchaadmin.client.dtos.CreateClientDTO;
import com.pedro.fitchaadmin.client.dtos.UpdateClientDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "tb_users")
@Entity(name = "Client")
@Getter
@NoArgsConstructor
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    @Column(nullable = false)
    private long credits;

    @Column(nullable = false)
    private boolean verified;

    public Client(CreateClientDTO createClientDTO) {
        this.name = createClientDTO.name();
        this.email = createClientDTO.email();
        this.password = createClientDTO.password();
        this.credits = createClientDTO.credits();
        this.verified = createClientDTO.verified();
    }

    public void updateFields(UpdateClientDTO updateClientDTO) {
        if (updateClientDTO.name() != null) {
            this.name = updateClientDTO.name();
        }

        if (updateClientDTO.email() != null) {
            this.email = updateClientDTO.email();
        }

        if (updateClientDTO.password() != null && !updateClientDTO.password().isBlank()) {
            this.password = updateClientDTO.password();
        }

        if (updateClientDTO.credits() != null) {
            this.credits = updateClientDTO.credits();
        }

        if (updateClientDTO.verified() != null) {
            this.verified = updateClientDTO.verified();
        }
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
