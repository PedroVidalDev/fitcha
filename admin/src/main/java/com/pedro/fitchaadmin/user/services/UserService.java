package com.pedro.fitchaadmin.user.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.pedro.fitchaadmin.user.dtos.CreateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UserDTO;
import com.pedro.fitchaadmin.user.dtos.UpdateUserDTO;
import com.pedro.fitchaadmin.user.entities.User;
import com.pedro.fitchaadmin.user.repositories.UserRepository;

@Service()
public class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
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
        User user = new User(createUserDTO);

        repository.save(user);

        return new UserDTO(user);
    }

    public UserDTO updateUser(String id, UpdateUserDTO updateUserDTO) {
        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User with ID " + id + " not found!"));

        user.updateFields(updateUserDTO);

        repository.save(user);
        return new UserDTO(user);
    }

    public void deleteUser(String id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User with ID " + id + " not found!"));

        repository.delete(user);
    }
}
