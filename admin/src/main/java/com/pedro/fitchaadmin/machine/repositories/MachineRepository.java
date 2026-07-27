package com.pedro.fitchaadmin.machine.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pedro.fitchaadmin.machine.entities.Machine;

public interface MachineRepository extends JpaRepository<Machine, String> {
    
}
