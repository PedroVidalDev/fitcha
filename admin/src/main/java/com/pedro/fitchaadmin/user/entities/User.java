package com.pedro.fitchaadmin.user.entities;

import com.pedro.fitchaadmin.user.dtos.CreateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UpdateUserDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "users")
@Entity(name = "User")
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String name;
    private String email;
    private String password;

    public User(CreateUserDTO createUserDTO) {
        this.name = createUserDTO.name();
        this.email = createUserDTO.email();
        this.password = createUserDTO.password();
    }

    public void updateFields(UpdateUserDTO updateUserDTO) {
        if (updateUserDTO.name() != null) {
            this.name = updateUserDTO.name();
        }

        if (updateUserDTO.email() != null) {
            this.email = updateUserDTO.email();
        }

        if (updateUserDTO.password() != null) {
            this.password = updateUserDTO.password();
        }
    }
}
