package com.pedro.fitchaadmin.errorlog.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.pedro.fitchaadmin.errorlog.services.ErrorLogService;

@Controller
@RequestMapping("/errors")
public class ErrorLogController {
    private final ErrorLogService service;

    public ErrorLogController(ErrorLogService service) {
        this.service = service;
    }

    @GetMapping
    public String getErrors(
            @RequestParam(defaultValue = ErrorLogService.FILTER_5XX) String type,
            Model model
    ) {
        String filter = service.normalizeFilter(type);
        model.addAttribute("errors", service.getErrorLogs(filter));
        model.addAttribute("type", filter);
        return "errors/index";
    }

    @GetMapping("/{id}")
    public String getErrorDetail(@PathVariable Long id, Model model) {
        model.addAttribute("error", service.getErrorLogById(id));
        return "errors/detail";
    }

    @PostMapping("/{id}/resolve")
    public String resolveError(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        service.markResolved(id);
        redirectAttributes.addFlashAttribute("successMessage", "Erro marcado como resolvido.");
        return "redirect:/errors";
    }
}
