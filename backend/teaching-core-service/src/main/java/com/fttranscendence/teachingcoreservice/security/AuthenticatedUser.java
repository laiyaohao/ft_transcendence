package com.fttranscendence.teachingcoreservice.security;

public record AuthenticatedUser(
    Long userId,
    String email,
    String role
) {
}