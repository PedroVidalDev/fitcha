package com.pedro.fitchaadmin.user.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pedro.fitchaadmin.user.entities.User;

public interface UserRepository extends JpaRepository<User, String> {
    
}
