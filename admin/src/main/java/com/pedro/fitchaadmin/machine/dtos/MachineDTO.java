package com.pedro.fitchaadmin.machine.dtos;

import java.time.Instant;
import java.util.List;

import com.pedro.fitchaadmin.machine.entities.Machine;

public record MachineDTO(
        String id,
        String slug,
        String name,
        String description,
        String photo,
        String categoryKey,
        String substitutionGroup,
        String trackingType,
        boolean requiresWeight,
        List<String> aliases,
        Instant createdAt,
        Instant updatedAt
) {
    public MachineDTO(Machine machine) {
        this(
                machine.getId(),
                machine.getSlug(),
                machine.getName(),
                machine.getDescription(),
                machine.getPhoto(),
                machine.getCategoryKey(),
                machine.getSubstitutionGroup(),
                machine.getTrackingType(),
                machine.isRequiresWeight(),
                List.copyOf(machine.getAliases()),
                machine.getCreatedAt(),
                machine.getUpdatedAt()
        );
    }

    public static MachineDTO empty() {
        return new MachineDTO(
                null, "", "", "", "", "peito", "", "sets", true, List.of(), null, null
        );
    }

    public String aliasesText() {
        return String.join(", ", aliases);
    }
}
