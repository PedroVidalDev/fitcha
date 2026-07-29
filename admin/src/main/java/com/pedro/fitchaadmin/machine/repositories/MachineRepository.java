package com.pedro.fitchaadmin.machine.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pedro.fitchaadmin.machine.entities.Machine;

public interface MachineRepository extends JpaRepository<Machine, String> {
    List<Machine> findAllByOrderByCategoryKeyAscNameAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);
}
