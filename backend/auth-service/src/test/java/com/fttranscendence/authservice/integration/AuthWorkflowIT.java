package com.fttranscendence.authservice.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fttranscendence.authservice.model.User;
import com.fttranscendence.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthWorkflowIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void clearUsers() {
        userRepository.deleteAll();
    }

    @Test
    void registerThenLoginPersistsAHashedPasswordAndReturnsValidSessionData() throws Exception {
        String registrationBody = """
            {
              "email": "tutor@example.com",
              "password": "password-123",
              "fullName": "Test Tutor",
              "role": "tutor"
            }
            """;

        String registrationResponse = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registrationBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("tutor@example.com"))
            .andExpect(jsonPath("$.fullName").value("Test Tutor"))
            .andExpect(jsonPath("$.role").value("tutor"))
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andReturn()
            .getResponse()
            .getContentAsString();

        User persistedUser = userRepository.findByEmail("tutor@example.com").orElseThrow();
        assertFalse(persistedUser.getPassword().equals("password-123"));
        assertTrue(passwordEncoder.matches("password-123", persistedUser.getPassword()));

        JsonNode registrationJson = objectMapper.readTree(registrationResponse);
        String registrationToken = registrationJson.get("token").asText();
        mockMvc.perform(get("/api/private-check")
                .header("Authorization", "Bearer " + registrationToken))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "tutor@example.com",
                      "password": "password-123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("tutor@example.com"))
            .andExpect(jsonPath("$.role").value("tutor"))
            .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void registrationRejectsInvalidAndDuplicateRequests() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "not-an-email",
                      "password": "",
                      "fullName": "",
                      "role": ""
                    }
                    """))
            .andExpect(status().isBadRequest());

        String validBody = """
            {
              "email": "student@example.com",
              "password": "password-123",
              "fullName": "Test Student",
              "role": "student"
            }
            """;
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validBody))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validBody))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void protectedRoutesRejectMissingAndMalformedTokens() throws Exception {
        mockMvc.perform(get("/api/private-check"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/private-check")
                .header("Authorization", "Bearer malformed-token"))
            .andExpect(status().isUnauthorized());
    }
}
