package com.pedro.fitchaadmin.client.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pedro.fitchaadmin.client.entities.Client;

public interface ClientRepository extends JpaRepository<Client, String> {
    
}
