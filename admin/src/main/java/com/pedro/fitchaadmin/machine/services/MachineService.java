package com.pedro.fitchaadmin.machine.services;

import java.util.List;
import java.util.Optional;

import com.pedro.fitchaadmin.machine.dtos.CreateMachineDTO;
import com.pedro.fitchaadmin.machine.dtos.MachineDTO;
import com.pedro.fitchaadmin.machine.dtos.UpdateMachineDTO;
import com.pedro.fitchaadmin.machine.entities.Machine;
import com.pedro.fitchaadmin.machine.repositories.MachineRepository;

public class MachineService {
    private final MachineRepository repository;

    public MachineService(MachineRepository repository) {
        this.repository = repository;
    }

    public List<MachineDTO> getMachines() {
        return repository.findAll().stream()
                .map(machine -> new MachineDTO(machine))
                .toList();
    }

    public MachineDTO getMachineById(String id) {
        Optional<Machine> machine = repository.findById(id);

        if (machine.isEmpty()) {
            throw new RuntimeException("Machine with ID " + id + " not found!");
        } 

        return new MachineDTO(machine.get());
    }

    public MachineDTO createMachine(CreateMachineDTO createMachineDTO) {
        Machine machine = new Machine(createMachineDTO);

        repository.save(machine);

        return new MachineDTO(machine);
    }

    public MachineDTO updateMachine(String id, UpdateMachineDTO updateMachineDTO) {
        Machine machine = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Machine with ID " + id + " not found!"));

        machine.updateFields(updateMachineDTO);

        repository.save(machine);
        return new MachineDTO(machine);
    }

    public void deleteMachine(String id) {
        Machine machine = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Machine with ID " + id + " not found!"));

        repository.delete(machine);
    }
}
