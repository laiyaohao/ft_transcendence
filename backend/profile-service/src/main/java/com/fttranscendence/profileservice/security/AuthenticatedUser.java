package com.fttranscendence.profileservice.security;

public record AuthenticatedUser(
    Long userId,
    String email,
    String role
) {
}