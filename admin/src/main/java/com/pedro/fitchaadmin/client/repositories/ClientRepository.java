package com.pedro.fitchaadmin.client.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pedro.fitchaadmin.client.entities.Client;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findAllByDeletedAtIsNull();

    Optional<Client> findByIdAndDeletedAtIsNull(Long id);

    long countByDeletedAtIsNull();
}
