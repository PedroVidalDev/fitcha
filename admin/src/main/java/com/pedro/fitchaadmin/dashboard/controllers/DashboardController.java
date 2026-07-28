package com.pedro.fitchaadmin.dashboard.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.pedro.fitchaadmin.client.services.ClientService;
import com.pedro.fitchaadmin.machine.services.MachineService;
import com.pedro.fitchaadmin.user.services.UserService;

@Controller
public class DashboardController {
    private final UserService userService;
    private final ClientService clientService;
    private final MachineService machineService;

    public DashboardController(
            UserService userService,
            ClientService clientService,
            MachineService machineService
    ) {
        this.userService = userService;
        this.clientService = clientService;
        this.machineService = machineService;
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/dashboard";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        long userCount = userService.countUsers();
        long activeUserCount = userService.countActiveUsers();

        model.addAttribute("userCount", userCount);
        model.addAttribute("activeUserCount", activeUserCount);
        model.addAttribute("clientCount", clientService.countClients());
        model.addAttribute("machineCount", machineService.countMachines());
        model.addAttribute("clients", clientService.getClients().stream().limit(5).toList());
        model.addAttribute(
                "activeUserPercentage",
                userCount == 0 ? 0 : Math.round((activeUserCount * 100.0) / userCount)
        );

        return "dashboard/index";
    }
}
