package com.fttranscendence.learning.student;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Boundary to auth-service, which is the sole authority for login identities
 * and account roles. The original Tutor bearer token is forwarded so auth can
 * apply the same Tutor-only directory authorization.
 */
@Service
public class AuthStudentDirectoryClient {
    private static final ParameterizedTypeReference<List<StudentAccount>> STUDENT_LIST =
        new ParameterizedTypeReference<>() { };

    private final RestTemplate rest;
    private final String baseUrl;

    public AuthStudentDirectoryClient(
        RestTemplate rest,
        @Value("${auth.service.url:http://localhost:8081}") String baseUrl
    ) {
        this.rest = rest;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
    }

    public List<StudentAccount> listStudents(String bearerToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.AUTHORIZATION, bearerToken);
            ResponseEntity<List<StudentAccount>> response = rest.exchange(
                baseUrl + "/api/auth/tutor/students",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                STUDENT_LIST
            );
            return response.getBody() == null ? List.of() : List.copyOf(response.getBody());
        } catch (Exception exception) {
            throw new StudentService.StudentDirectoryUnavailableException(exception);
        }
    }

    public record StudentAccount(long id, String fullName, String email) { }
}
