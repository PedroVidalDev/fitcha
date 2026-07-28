package com.pedro.fitchaadmin.user.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.pedro.fitchaadmin.user.dtos.CreateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UpdateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UserDTO;
import com.pedro.fitchaadmin.user.enums.UserRole;
import com.pedro.fitchaadmin.user.services.UserService;

@Controller
@RequestMapping("/users")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public String getUsers(Model model) {
        model.addAttribute("users", service.getUsers());
        return "users/index";
    }

    @GetMapping("/new")
    public String createUserForm(Model model) {
        model.addAttribute("user", new UserDTO(null, "", "", UserRole.ADMIN, true));
        model.addAttribute("roles", UserRole.values());
        model.addAttribute("editing", false);
        return "users/form";
    }

    @PostMapping
    public String createUser(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam UserRole role,
            RedirectAttributes redirectAttributes
    ) {
        service.createUser(new CreateUserDTO(name, email, password, role));
        redirectAttributes.addFlashAttribute("successMessage", "Usuário criado com sucesso.");
        return "redirect:/users";
    }

    @GetMapping("/{id}/edit")
    public String updateUserForm(@PathVariable String id, Model model) {
        model.addAttribute("user", service.getUserById(id));
        model.addAttribute("roles", UserRole.values());
        model.addAttribute("editing", true);
        return "users/form";
    }

    @PostMapping("/{id}")
    public String updateUser(
            @PathVariable String id,
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam(required = false) String password,
            @RequestParam UserRole role,
            RedirectAttributes redirectAttributes
    ) {
        service.updateUser(id, new UpdateUserDTO(name, email, password, role));
        redirectAttributes.addFlashAttribute("successMessage", "Usuário atualizado com sucesso.");
        return "redirect:/users";
    }

    @PostMapping("/{id}/delete")
    public String deleteUser(@PathVariable String id, RedirectAttributes redirectAttributes) {
        service.deleteUser(id);
        redirectAttributes.addFlashAttribute("successMessage", "Usuário removido com sucesso.");
        return "redirect:/users";
    }
}
