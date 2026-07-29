package com.pedro.fitchaadmin.client.dtos;

public record UpdateClientDTO(String name, String email, String password, Long credits, Boolean verified) {
}
