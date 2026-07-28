package com.pedro.fitchaadmin.machine.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
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
        model.addAttribute("machine", new MachineDTO(null, "", ""));
        model.addAttribute("editing", false);
        return "machines/form";
    }

    @PostMapping
    public String createMachine(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            RedirectAttributes redirectAttributes
    ) {
        service.createMachine(new CreateMachineDTO(name, description));
        redirectAttributes.addFlashAttribute("successMessage", "Máquina criada com sucesso.");
        return "redirect:/machines";
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
            @RequestParam String name,
            @RequestParam(required = false) String description,
            RedirectAttributes redirectAttributes
    ) {
        service.updateMachine(id, new UpdateMachineDTO(name, description));
        redirectAttributes.addFlashAttribute("successMessage", "Máquina atualizada com sucesso.");
        return "redirect:/machines";
    }

    @PostMapping("/{id}/delete")
    public String deleteMachine(@PathVariable String id, RedirectAttributes redirectAttributes) {
        service.deleteMachine(id);
        redirectAttributes.addFlashAttribute("successMessage", "Máquina removida com sucesso.");
        return "redirect:/machines";
    }
}
