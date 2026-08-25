package com.fttranscendence.authservice.security;

import com.fttranscendence.authservice.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(
            jwtService,
            "secretKey",
            "test-secret-key-that-is-at-least-thirty-two-bytes-long"
        );
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3_600_000L);

        user = new User();
        user.setEmail("student@example.com");
        user.setPassword("encoded-password");
        user.setFullName("Test Student");
        user.setRole("STUDENT");
    }

    @Test
    void generatedTokenContainsTheUserEmailAndIsValidForThatUser() {
        String token = jwtService.generateToken(user);

        assertEquals(user.getEmail(), jwtService.extractEmail(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void generatedTokenCanCarryAdditionalClaims() {
        String token = jwtService.generateToken(Map.of("role", "STUDENT"), user);

        assertEquals(
            "STUDENT",
            jwtService.extractClaim(token, claims -> claims.get("role", String.class))
        );
    }

    @Test
    void tokenIsInvalidForAUserWithADifferentEmail() {
        String token = jwtService.generateToken(user);
        User otherUser = new User();
        otherUser.setEmail("someone-else@example.com");
        otherUser.setPassword("encoded-password");
        otherUser.setFullName("Someone Else");
        otherUser.setRole("STUDENT");

        assertFalse(jwtService.isTokenValid(token, otherUser));
    }
}
