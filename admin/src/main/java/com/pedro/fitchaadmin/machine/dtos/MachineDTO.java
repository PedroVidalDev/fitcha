package com.pedro.fitchaadmin.machine.dtos;

import com.pedro.fitchaadmin.machine.entities.Machine;

public record MachineDTO(String id, String name, String description) {
    public MachineDTO(Machine machine) {
        this(machine.getId(), machine.getName(), machine.getDescription());
    }
}
