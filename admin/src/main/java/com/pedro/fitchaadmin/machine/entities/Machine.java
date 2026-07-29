package com.pedro.fitchaadmin.machine.entities;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.pedro.fitchaadmin.machine.dtos.CreateMachineDTO;
import com.pedro.fitchaadmin.machine.dtos.UpdateMachineDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "tb_machines")
@Entity(name = "Machine")
@Getter
@NoArgsConstructor
public class Machine {
    @Id
    @Column(length = 16, updatable = false)
    private String id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(columnDefinition = "text")
    private String photo;

    @Column(name = "category_key", nullable = false, length = 30)
    private String categoryKey;

    @Column(name = "substitution_group", nullable = false, length = 80)
    private String substitutionGroup;

    @Column(name = "tracking_type", nullable = false, length = 30)
    private String trackingType;

    @Column(name = "requires_weight", nullable = false)
    private boolean requiresWeight;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> aliases = new ArrayList<>();

    public Machine(CreateMachineDTO createMachineDTO) {
        this.id = "mach" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        applyFields(
                createMachineDTO.slug(),
                createMachineDTO.name(),
                createMachineDTO.description(),
                createMachineDTO.categoryKey(),
                createMachineDTO.substitutionGroup(),
                createMachineDTO.trackingType(),
                createMachineDTO.requiresWeight(),
                createMachineDTO.aliases()
        );
        this.photo = createMachineDTO.photo() == null ? "" : createMachineDTO.photo();
    }

    public void updateFields(UpdateMachineDTO updateMachineDTO) {
        applyFields(
                updateMachineDTO.slug(),
                updateMachineDTO.name(),
                updateMachineDTO.description(),
                updateMachineDTO.categoryKey(),
                updateMachineDTO.substitutionGroup(),
                updateMachineDTO.trackingType(),
                updateMachineDTO.requiresWeight(),
                updateMachineDTO.aliases()
        );

        if (updateMachineDTO.removePhoto()) {
            this.photo = "";
        } else if (updateMachineDTO.photo() != null) {
            this.photo = updateMachineDTO.photo();
        }
    }

    private void applyFields(
            String slug,
            String name,
            String description,
            String categoryKey,
            String substitutionGroup,
            String trackingType,
            boolean requiresWeight,
            List<String> aliases
    ) {
        this.slug = slug;
        this.name = name;
        this.description = description == null ? "" : description;
        this.categoryKey = categoryKey;
        this.substitutionGroup = substitutionGroup == null ? "" : substitutionGroup;
        this.trackingType = trackingType;
        this.requiresWeight = requiresWeight;
        this.aliases = aliases == null ? new ArrayList<>() : new ArrayList<>(aliases);
    }
}
