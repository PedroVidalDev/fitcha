package com.pedro.fitchaadmin.client.services;

import java.util.List;
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
        return repository.findAllByDeletedAtIsNull().stream()
                .map(ClientDTO::new)
                .toList();
    }

    public ClientDTO getClientById(Long id) {
        Client client = findActiveClient(id);
        return new ClientDTO(client);
    }

    public ClientDTO createClient(CreateClientDTO createClientDTO) {
        CreateClientDTO securedClientDTO = new CreateClientDTO(
                createClientDTO.name(),
                createClientDTO.email(),
                passwordEncoder.encode(createClientDTO.password()),
                createClientDTO.credits(),
                createClientDTO.verified()
        );
        Client client = new Client(securedClientDTO);

        repository.save(client);

        return new ClientDTO(client);
    }

    public ClientDTO updateClient(Long id, UpdateClientDTO updateClientDTO) {
        Client client = findActiveClient(id);

        String encodedPassword = updateClientDTO.password();
        if (encodedPassword != null && !encodedPassword.isBlank()) {
            encodedPassword = passwordEncoder.encode(encodedPassword);
        } else {
            encodedPassword = null;
        }

        client.updateFields(new UpdateClientDTO(
                updateClientDTO.name(),
                updateClientDTO.email(),
                encodedPassword,
                updateClientDTO.credits(),
                updateClientDTO.verified()
        ));

        repository.save(client);
        return new ClientDTO(client);
    }

    public void deleteClient(Long id) {
        Client client = findActiveClient(id);

        client.softDelete();
        repository.save(client);
    }

    public long countClients() {
        return repository.countByDeletedAtIsNull();
    }

    private Client findActiveClient(Long id) {
        return repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Client with ID " + id + " not found!"));
    }
}
