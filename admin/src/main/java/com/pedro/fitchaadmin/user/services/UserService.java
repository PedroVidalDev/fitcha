package com.pedro.fitchaadmin.user.services;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pedro.fitchaadmin.user.dtos.CreateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UserDTO;
import com.pedro.fitchaadmin.user.dtos.UpdateUserDTO;
import com.pedro.fitchaadmin.user.entities.User;
import com.pedro.fitchaadmin.user.repositories.UserRepository;

@Service()
public class UserService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDTO> getUsers() {
        return repository.findAll().stream()
                .map(machine -> new UserDTO(machine))
                .toList();
    }

    public UserDTO getUserById(String id) {
        Optional<User> user = repository.findById(id);

        if (user.isEmpty()) {
            throw new RuntimeException("User with ID " + id + " not found!");
        } 

        return new UserDTO(user.get());
    }

    public UserDTO createUser(CreateUserDTO createUserDTO) {
        CreateUserDTO securedUserDTO = new CreateUserDTO(
                createUserDTO.name(),
                createUserDTO.email(),
                passwordEncoder.encode(createUserDTO.password()),
                createUserDTO.role()
        );
        User user = new User(securedUserDTO);

        repository.save(user);

        return new UserDTO(user);
    }

    public UserDTO updateUser(String id, UpdateUserDTO updateUserDTO) {
        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User with ID " + id + " not found!"));

        String encodedPassword = updateUserDTO.password();
        if (encodedPassword != null && !encodedPassword.isBlank()) {
            encodedPassword = passwordEncoder.encode(encodedPassword);
        } else {
            encodedPassword = null;
        }

        user.updateFields(new UpdateUserDTO(
                updateUserDTO.name(),
                updateUserDTO.email(),
                encodedPassword,
                updateUserDTO.role()
        ));

        repository.save(user);
        return new UserDTO(user);
    }

    public void deleteUser(String id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User with ID " + id + " not found!"));

        repository.delete(user);
    }

    public long countUsers() {
        return repository.count();
    }

    public long countActiveUsers() {
        return repository.findAll().stream()
                .filter(User::isActive)
                .count();
    }
}
