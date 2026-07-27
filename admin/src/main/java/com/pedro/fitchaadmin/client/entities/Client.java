package com.pedro.fitchaadmin.client.entities;

import com.pedro.fitchaadmin.client.dtos.CreateClientDTO;
import com.pedro.fitchaadmin.client.dtos.UpdateClientDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "clients")
@Entity(name = "Client")
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Client {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String name;
    private String email;
    private String password;

    public Client(CreateClientDTO createClientDTO) {
        this.name = createClientDTO.name();
        this.email = createClientDTO.email();
        this.password = createClientDTO.password();
    }

    public void updateFields(UpdateClientDTO updateClientDTO) {
        if (updateClientDTO.name() != null) {
            this.name = updateClientDTO.name();
        }

        if (updateClientDTO.email() != null) {
            this.email = updateClientDTO.email();
        }

        if (updateClientDTO.password() != null) {
            this.password = updateClientDTO.password();
        }
    }
}
