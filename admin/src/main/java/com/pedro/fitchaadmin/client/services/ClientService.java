package com.pedro.fitchaadmin.client.services;

import java.util.List;
import java.util.Optional;

import com.pedro.fitchaadmin.client.dtos.ClientDTO;
import com.pedro.fitchaadmin.client.dtos.CreateClientDTO;
import com.pedro.fitchaadmin.client.dtos.UpdateClientDTO;
import com.pedro.fitchaadmin.client.entities.Client;
import com.pedro.fitchaadmin.client.repositories.ClientRepository;

public class ClientService {
    private final ClientRepository repository;

    public ClientService(ClientRepository repository) {
        this.repository = repository;
    }

    public List<ClientDTO> getClients() {
        return repository.findAll().stream()
                .map(machine -> new ClientDTO(machine))
                .toList();
    }

    public ClientDTO getClientById(String id) {
        Optional<Client> client = repository.findById(id);

        if (client.isEmpty()) {
            throw new RuntimeException("Client with ID " + id + " not found!");
        } 

        return new ClientDTO(client.get());
    }

    public ClientDTO createClient(CreateClientDTO createClientDTO) {
        Client client = new Client(createClientDTO);

        repository.save(client);

        return new ClientDTO(client);
    }

    public ClientDTO updateClient(String id, UpdateClientDTO updateClientDTO) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client with ID " + id + " not found!"));

        client.updateFields(updateClientDTO);

        repository.save(client);
        return new ClientDTO(client);
    }

    public void deleteClient(String id) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client with ID " + id + " not found!"));

        repository.delete(client);
    }
}
