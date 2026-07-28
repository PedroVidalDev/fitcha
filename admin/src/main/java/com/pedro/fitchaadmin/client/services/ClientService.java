package com.pedro.fitchaadmin.client.services;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pedro.fitchaadmin.client.dtos.ClientDTO;
import com.pedro.fitchaadmin.client.dtos.CreateClientDTO;
import com.pedro.fitchaadmin.client.dtos.UpdateClientDTO;
import com.pedro.fitchaadmin.client.entities.Client;
import com.pedro.fitchaadmin.client.repositories.ClientRepository;

@Service()
public class ClientService {
    private final ClientRepository repository;
    private final PasswordEncoder passwordEncoder;

    public ClientService(ClientRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<ClientDTO> getClients() {
        return repository.findAll().stream()
                .map(machine -> new ClientDTO(machine))
                .toList();
    }

    public ClientDTO getClientById(Long id) {
        Optional<Client> client = repository.findById(id);

        if (client.isEmpty()) {
            throw new RuntimeException("Client with ID " + id + " not found!");
        } 

        return new ClientDTO(client.get());
    }

    public ClientDTO createClient(CreateClientDTO createClientDTO) {
        CreateClientDTO securedClientDTO = new CreateClientDTO(
                createClientDTO.name(),
                createClientDTO.email(),
                passwordEncoder.encode(createClientDTO.password())
        );
        Client client = new Client(securedClientDTO);

        repository.save(client);

        return new ClientDTO(client);
    }

    public ClientDTO updateClient(Long id, UpdateClientDTO updateClientDTO) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client with ID " + id + " not found!"));

        String encodedPassword = updateClientDTO.password();
        if (encodedPassword != null && !encodedPassword.isBlank()) {
            encodedPassword = passwordEncoder.encode(encodedPassword);
        } else {
            encodedPassword = null;
        }

        client.updateFields(new UpdateClientDTO(
                updateClientDTO.name(),
                updateClientDTO.email(),
                encodedPassword
        ));

        repository.save(client);
        return new ClientDTO(client);
    }

    public void deleteClient(Long id) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client with ID " + id + " not found!"));

        repository.delete(client);
    }

    public long countClients() {
        return repository.count();
    }
}
