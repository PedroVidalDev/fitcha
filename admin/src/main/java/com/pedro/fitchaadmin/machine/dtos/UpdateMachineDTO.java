package com.pedro.fitchaadmin.machine.dtos;

import java.util.List;

public record UpdateMachineDTO(
        String slug,
        String name,
        String description,
        String photo,
        boolean removePhoto,
        String categoryKey,
        String substitutionGroup,
        String trackingType,
        boolean requiresWeight,
        List<String> aliases
) {
}
