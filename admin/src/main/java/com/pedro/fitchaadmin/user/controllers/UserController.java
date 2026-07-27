package com.pedro.fitchaadmin.user.controllers;

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

import com.pedro.fitchaadmin.user.dtos.CreateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UpdateUserDTO;
import com.pedro.fitchaadmin.user.dtos.UserDTO;
import com.pedro.fitchaadmin.user.services.UserService;

@RestController
@RequestMapping("users")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getUsers() {
        return ResponseEntity.ok(this.service.getUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(this.service.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody CreateUserDTO createUserDTO) {
        UserDTO userDTO = this.service.createUser(createUserDTO);

        URI location = URI.create("/users/" + userDTO.id());

        return ResponseEntity.created(location).body(userDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String id, @RequestBody UpdateUserDTO updateUserDTO) {
        UserDTO userDTO = this.service.updateUser(id, updateUserDTO);

        return ResponseEntity.ok(userDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity.HeadersBuilder<?> deleteUser(@PathVariable String id) {
        this.service.deleteUser(id);

        return ResponseEntity.noContent();
    }
}
