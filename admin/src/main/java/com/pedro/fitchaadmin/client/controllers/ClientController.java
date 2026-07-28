package com.pedro.fitchaadmin.client.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.pedro.fitchaadmin.client.dtos.ClientDTO;
import com.pedro.fitchaadmin.client.dtos.CreateClientDTO;
import com.pedro.fitchaadmin.client.dtos.UpdateClientDTO;
import com.pedro.fitchaadmin.client.services.ClientService;

@Controller
@RequestMapping("/clients")
public class ClientController {
    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @GetMapping
    public String getClients(Model model) {
        model.addAttribute("clients", service.getClients());
        return "clients/index";
    }

    @GetMapping("/new")
    public String createClientForm(Model model) {
        model.addAttribute("client", new ClientDTO(null, "", ""));
        model.addAttribute("editing", false);
        return "clients/form";
    }

    @PostMapping
    public String createClient(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String password,
            RedirectAttributes redirectAttributes
    ) {
        service.createClient(new CreateClientDTO(name, email, password));
        redirectAttributes.addFlashAttribute("successMessage", "Cliente criado com sucesso.");
        return "redirect:/clients";
    }

    @GetMapping("/{id}/edit")
    public String updateClientForm(@PathVariable Long id, Model model) {
        model.addAttribute("client", service.getClientById(id));
        model.addAttribute("editing", true);
        return "clients/form";
    }

    @PostMapping("/{id}")
    public String updateClient(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam(required = false) String password,
            RedirectAttributes redirectAttributes
    ) {
        service.updateClient(id, new UpdateClientDTO(name, email, password));
        redirectAttributes.addFlashAttribute("successMessage", "Cliente atualizado com sucesso.");
        return "redirect:/clients";
    }

    @PostMapping("/{id}/delete")
    public String deleteClient(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        service.deleteClient(id);
        redirectAttributes.addFlashAttribute("successMessage", "Cliente removido com sucesso.");
        return "redirect:/clients";
    }
}
