package com.pedro.fitchaadmin.machine.entities;

import com.pedro.fitchaadmin.machine.dtos.CreateMachineDTO;
import com.pedro.fitchaadmin.machine.dtos.UpdateMachineDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "tb_machines")
@Entity(name = "Machine")
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Machine {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String name;
    private String description;

    public Machine(CreateMachineDTO createMachineDTO) {
        this.name = createMachineDTO.name();
        this.description = createMachineDTO.description();
    }

    public void updateFields(UpdateMachineDTO updateMachineDTO) {
        if (updateMachineDTO.name() != null) {
            this.name = updateMachineDTO.name();
        }
        if (updateMachineDTO.description() != null) {
            this.description = updateMachineDTO.description();
        }
    }
}
