package com.pedro.fitchaadmin.client.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.fitchaadmin.client.dtos.ClientDTO;
import com.pedro.fitchaadmin.client.dtos.CreateClientDTO;
import com.pedro.fitchaadmin.client.dtos.UpdateClientDTO;
import com.pedro.fitchaadmin.client.services.ClientService;

@RestController
@RequestMapping("clients")
public class ClientController {
    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ClientDTO>> getClients() {
        return ResponseEntity.ok(this.service.getClients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> getClientById(@PathVariable String id) {
        return ResponseEntity.ok(this.service.getClientById(id));
    }

    @PostMapping
    public ResponseEntity<ClientDTO> createClient(@RequestBody CreateClientDTO createClientDTO) {
        ClientDTO clientDTO = this.service.createClient(createClientDTO);

        URI location = URI.create("/clients/" + clientDTO.id());

        return ResponseEntity.created(location).body(clientDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable String id, @RequestBody UpdateClientDTO updateClientDTO) {
        ClientDTO clientDTO = this.service.updateClient(id, updateClientDTO);

        return ResponseEntity.ok(clientDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity.HeadersBuilder<?> deleteClient(@PathVariable String id) {
        this.service.deleteClient(id);

        return ResponseEntity.noContent();
    }
}
