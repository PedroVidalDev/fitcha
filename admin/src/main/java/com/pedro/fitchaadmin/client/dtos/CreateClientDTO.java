package com.pedro.fitchaadmin.client.dtos;

public record CreateClientDTO(String name, String email, String password, long credits, boolean verified) {
}
