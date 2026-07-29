package com.pedro.fitchaadmin.machine.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.pedro.fitchaadmin.machine.dtos.CreateMachineDTO;
import com.pedro.fitchaadmin.machine.dtos.MachineDTO;
import com.pedro.fitchaadmin.machine.dtos.UpdateMachineDTO;
import com.pedro.fitchaadmin.machine.services.MachineService;

@Controller
@RequestMapping("/machines")
public class MachineController {
    private final MachineService service;

    public MachineController(MachineService service) {
        this.service = service;
    }

    @GetMapping
    public String getMachines(Model model) {
        model.addAttribute("machines", service.getMachines());
        return "machines/index";
    }

    @GetMapping("/new")
    public String createMachineForm(Model model) {
        model.addAttribute("machine", MachineDTO.empty());
        model.addAttribute("editing", false);
        return "machines/form";
    }

    @PostMapping
    public String createMachine(
            @RequestParam String slug,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam String categoryKey,
            @RequestParam(required = false) String substitutionGroup,
            @RequestParam String trackingType,
            @RequestParam(defaultValue = "false") boolean requiresWeight,
            @RequestParam(required = false) String aliases,
            @RequestParam(required = false) MultipartFile photo,
            RedirectAttributes redirectAttributes
    ) {
        try {
            service.createMachine(new CreateMachineDTO(
                    slug, name, description, null, categoryKey, substitutionGroup, trackingType,
                    requiresWeight, service.parseAliases(aliases)
            ), photo);
            redirectAttributes.addFlashAttribute("successMessage", "Máquina criada com sucesso.");
            return "redirect:/machines";
        } catch (IllegalArgumentException exception) {
            redirectAttributes.addFlashAttribute("errorMessage", exception.getMessage());
            return "redirect:/machines/new";
        }
    }

    @GetMapping("/{id}/edit")
    public String updateMachineForm(@PathVariable String id, Model model) {
        model.addAttribute("machine", service.getMachineById(id));
        model.addAttribute("editing", true);
        return "machines/form";
    }

    @PostMapping("/{id}")
    public String updateMachine(
            @PathVariable String id,
            @RequestParam String slug,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam String categoryKey,
            @RequestParam(required = false) String substitutionGroup,
            @RequestParam String trackingType,
            @RequestParam(defaultValue = "false") boolean requiresWeight,
            @RequestParam(required = false) String aliases,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(defaultValue = "false") boolean removePhoto,
            RedirectAttributes redirectAttributes
    ) {
        try {
            service.updateMachine(id, new UpdateMachineDTO(
                    slug, name, description, null, removePhoto, categoryKey, substitutionGroup, trackingType,
                    requiresWeight, service.parseAliases(aliases)
            ), photo);
            redirectAttributes.addFlashAttribute("successMessage", "Máquina atualizada com sucesso.");
            return "redirect:/machines";
        } catch (IllegalArgumentException exception) {
            redirectAttributes.addFlashAttribute("errorMessage", exception.getMessage());
            return "redirect:/machines/" + id + "/edit";
        }
    }

    @PostMapping("/{id}/delete")
    public String deleteMachine(@PathVariable String id, RedirectAttributes redirectAttributes) {
        service.deleteMachine(id);
        redirectAttributes.addFlashAttribute("successMessage", "Máquina removida com sucesso.");
        return "redirect:/machines";
    }
}
