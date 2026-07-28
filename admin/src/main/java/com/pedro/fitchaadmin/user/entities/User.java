package com.pedro.fitchaadmin.user.entities;

import com.pedro.fitchaadmin.user.dtos.CreateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UpdateUserDTO;
import com.pedro.fitchaadmin.user.enums.UserRole;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "tb_admin_users")
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
    @Enumerated(EnumType.STRING)
    private UserRole role;
    private boolean isActive;

    public User(CreateUserDTO createUserDTO) {
        this.name = createUserDTO.name();
        this.email = createUserDTO.email();
        this.password = createUserDTO.password();
        this.role = createUserDTO.role();
        this.isActive = true;
    }

    public void updateFields(UpdateUserDTO updateUserDTO) {
        if (updateUserDTO.name() != null) {
            this.name = updateUserDTO.name();
        }

        if (updateUserDTO.email() != null) {
            this.email = updateUserDTO.email();
        }

        if (updateUserDTO.password() != null && !updateUserDTO.password().isBlank()) {
            this.password = updateUserDTO.password();
        }

        if (updateUserDTO.role() != null) {
            this.role = updateUserDTO.role();
        }
    }
}
