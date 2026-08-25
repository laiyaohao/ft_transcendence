package com.fttranscendence.authservice.service;

import com.fttranscendence.authservice.model.User;
import com.fttranscendence.authservice.model.UserRole;
import com.fttranscendence.authservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class TutorBootstrapRunner implements ApplicationRunner {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern STRONG_PASSWORD = Pattern.compile(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;

    public TutorBootstrapRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${bootstrap.tutor.email:}") String email,
            @Value("${bootstrap.tutor.password:}") String password,
            @Value("${bootstrap.tutor.full-name:}") String fullName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean anyConfigured = StringUtils.hasText(email)
            || StringUtils.hasText(password)
            || StringUtils.hasText(fullName);
        if (!anyConfigured) {
            return;
        }
        if (!StringUtils.hasText(email)
                || !StringUtils.hasText(password)
                || !StringUtils.hasText(fullName)) {
            throw new IllegalStateException("All Tutor bootstrap values must be supplied together");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String normalizedName = fullName.trim();
        if (normalizedEmail.length() > 254 || !EMAIL.matcher(normalizedEmail).matches()) {
            throw new IllegalStateException("BOOTSTRAP_TUTOR_EMAIL is invalid");
        }
        if (normalizedName.length() < 2 || normalizedName.length() > 100) {
            throw new IllegalStateException("BOOTSTRAP_TUTOR_FULL_NAME must contain 2 to 100 characters");
        }
        if (password.length() < 12
                || password.length() > 128
                || !STRONG_PASSWORD.matcher(password).matches()) {
            throw new IllegalStateException("BOOTSTRAP_TUTOR_PASSWORD does not meet the password policy");
        }

        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(existing -> {
            if (existing.getRole() != UserRole.TUTOR) {
                throw new IllegalStateException("Tutor bootstrap email belongs to a non-Tutor account");
            }
        }, () -> {
            User tutor = new User();
            tutor.setEmail(normalizedEmail);
            tutor.setPassword(passwordEncoder.encode(password));
            tutor.setFullName(normalizedName);
            tutor.setRole(UserRole.TUTOR);
            userRepository.save(tutor);
        });
    }
}
