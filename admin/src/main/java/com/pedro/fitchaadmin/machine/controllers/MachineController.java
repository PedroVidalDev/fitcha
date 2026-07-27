package com.pedro.fitchaadmin.machine.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.fitchaadmin.machine.dtos.CreateMachineDTO;
import com.pedro.fitchaadmin.machine.dtos.MachineDTO;
import com.pedro.fitchaadmin.machine.dtos.UpdateMachineDTO;
import com.pedro.fitchaadmin.machine.services.MachineService;

@RestController
@RequestMapping("machines")
public class MachineController {
    private final MachineService service;

    public MachineController(MachineService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MachineDTO>> getMachines() {
        return ResponseEntity.ok(this.service.getMachines());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineDTO> getMachineById(@PathVariable String id) {
        return ResponseEntity.ok(this.service.getMachineById(id));
    }

    @PostMapping
    public ResponseEntity<MachineDTO> createMachine(@RequestBody CreateMachineDTO createMachineDTO) {
        MachineDTO machineDTO = this.service.createMachine(createMachineDTO);

        URI location = URI.create("/machines/" + machineDTO.id());

        return ResponseEntity.created(location).body(machineDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MachineDTO> updateMachine(@PathVariable String id, @RequestBody UpdateMachineDTO updateMachineDTO) {
        MachineDTO machineDTO = this.service.updateMachine(id, updateMachineDTO);

        return ResponseEntity.ok(machineDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity.HeadersBuilder<?> deleteMachine(@PathVariable String id) {
        this.service.deleteMachine(id);

        return ResponseEntity.noContent();
    }
}
