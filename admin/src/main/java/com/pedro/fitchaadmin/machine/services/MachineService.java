package com.pedro.fitchaadmin.machine.services;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.pedro.fitchaadmin.machine.dtos.CreateMachineDTO;
import com.pedro.fitchaadmin.machine.dtos.MachineDTO;
import com.pedro.fitchaadmin.machine.dtos.UpdateMachineDTO;
import com.pedro.fitchaadmin.machine.entities.Machine;
import com.pedro.fitchaadmin.machine.repositories.MachineRepository;

@Service
public class MachineService {
    private static final Set<String> CATEGORY_KEYS = Set.of(
            "peito", "costas", "pernas", "ombros", "biceps", "triceps", "antebraco", "core", "cardio"
    );
    private static final Set<String> TRACKING_TYPES = Set.of("sets", "duration");

    private final MachineRepository repository;
    private final MachineImageService imageService;

    public MachineService(MachineRepository repository, MachineImageService imageService) {
        this.repository = repository;
        this.imageService = imageService;
    }

    public List<MachineDTO> getMachines() {
        return repository.findAllByOrderByCategoryKeyAscNameAsc().stream()
                .map(MachineDTO::new)
                .toList();
    }

    public MachineDTO getMachineById(String id) {
        return new MachineDTO(findMachine(id));
    }

    public MachineDTO createMachine(CreateMachineDTO createMachineDTO, MultipartFile image) {
        CreateMachineDTO normalized = normalizeCreate(createMachineDTO, imageService.toDataUri(image));
        if (repository.existsBySlug(normalized.slug())) {
            throw new IllegalArgumentException("Já existe uma máquina cadastrada com este slug.");
        }

        Machine machine = new Machine(normalized);
        repository.save(machine);

        return new MachineDTO(machine);
    }

    public MachineDTO updateMachine(String id, UpdateMachineDTO updateMachineDTO, MultipartFile image) {
        Machine machine = findMachine(id);
        UpdateMachineDTO normalized = normalizeUpdate(
                updateMachineDTO,
                updateMachineDTO.removePhoto() ? null : imageService.toDataUri(image)
        );

        if (repository.existsBySlugAndIdNot(normalized.slug(), id)) {
            throw new IllegalArgumentException("Já existe uma máquina cadastrada com este slug.");
        }

        machine.updateFields(normalized);
        repository.save(machine);
        return new MachineDTO(machine);
    }

    public void deleteMachine(String id) {
        repository.delete(findMachine(id));
    }

    public long countMachines() {
        return repository.count();
    }

    private Machine findMachine(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Machine with ID " + id + " not found!"));
    }

    private CreateMachineDTO normalizeCreate(CreateMachineDTO input, String photo) {
        MachineFields fields = normalizeFields(
                input.slug(),
                input.name(),
                input.description(),
                input.categoryKey(),
                input.substitutionGroup(),
                input.trackingType(),
                input.requiresWeight(),
                input.aliases()
        );

        return new CreateMachineDTO(
                fields.slug(), fields.name(), fields.description(), photo, fields.categoryKey(),
                fields.substitutionGroup(), fields.trackingType(), fields.requiresWeight(), fields.aliases()
        );
    }

    private UpdateMachineDTO normalizeUpdate(UpdateMachineDTO input, String photo) {
        MachineFields fields = normalizeFields(
                input.slug(),
                input.name(),
                input.description(),
                input.categoryKey(),
                input.substitutionGroup(),
                input.trackingType(),
                input.requiresWeight(),
                input.aliases()
        );

        return new UpdateMachineDTO(
                fields.slug(), fields.name(), fields.description(), photo, input.removePhoto(), fields.categoryKey(),
                fields.substitutionGroup(), fields.trackingType(), fields.requiresWeight(), fields.aliases()
        );
    }

    private MachineFields normalizeFields(
            String slug,
            String name,
            String description,
            String categoryKey,
            String substitutionGroup,
            String trackingType,
            boolean requiresWeight,
            List<String> aliases
    ) {
        String normalizedName = required(name, "Informe o nome da máquina.");
        String normalizedSlug = slugify(slug);
        String normalizedCategoryKey = required(categoryKey, "Informe a categoria da máquina.").toLowerCase(Locale.ROOT);
        String normalizedTrackingType = required(trackingType, "Informe o tipo de registro.").toLowerCase(Locale.ROOT);

        if (!CATEGORY_KEYS.contains(normalizedCategoryKey)) {
            throw new IllegalArgumentException("A categoria da máquina é inválida.");
        }

        if (!TRACKING_TYPES.contains(normalizedTrackingType)) {
            throw new IllegalArgumentException("O tipo de registro é inválido.");
        }

        return new MachineFields(
                normalizedSlug,
                normalizedName,
                normalizeText(description),
                normalizedCategoryKey,
                normalizeText(substitutionGroup),
                normalizedTrackingType,
                "duration".equals(normalizedTrackingType) ? false : requiresWeight,
                normalizeAliases(aliases)
        );
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(required(value, "Informe o slug da máquina."), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");

        if (normalized.isBlank() || normalized.length() > 120) {
            throw new IllegalArgumentException("O slug deve ter entre 1 e 120 caracteres.");
        }

        return normalized;
    }

    private String required(String value, String message) {
        String normalized = normalizeText(value);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private List<String> normalizeAliases(List<String> aliases) {
        if (aliases == null) {
            return List.of();
        }

        return aliases.stream()
                .map(this::normalizeText)
                .filter(alias -> !alias.isBlank())
                .distinct()
                .toList();
    }

    public List<String> parseAliases(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split("[,\\n]"))
                .toList();
    }

    private record MachineFields(
            String slug,
            String name,
            String description,
            String categoryKey,
            String substitutionGroup,
            String trackingType,
            boolean requiresWeight,
            List<String> aliases
    ) {
    }
}
