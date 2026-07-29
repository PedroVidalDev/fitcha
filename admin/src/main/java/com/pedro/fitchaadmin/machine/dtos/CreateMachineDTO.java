package com.pedro.fitchaadmin.machine.dtos;

import java.util.List;

public record CreateMachineDTO(
        String slug,
        String name,
        String description,
        String photo,
        String categoryKey,
        String substitutionGroup,
        String trackingType,
        boolean requiresWeight,
        List<String> aliases
) {
}
