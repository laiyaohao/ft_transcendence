package com.fttranscendence.grading.config;

import com.fttranscendence.grading.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      JwtAuthenticationFilter jwtAuthenticationFilter
  ) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                // Every domain API is explicitly role-scoped.  Do not fall back to
                // "authenticated" here: new endpoints must opt into a policy.
                .requestMatchers("/api/grading/tutor/**").hasRole("TUTOR")
                .requestMatchers(HttpMethod.GET, "/api/grading/student/worksheets/*/results")
                    .hasRole("STUDENT")
                .requestMatchers(HttpMethod.GET, "/api/grading/student/mistakes")
                    .hasRole("STUDENT")
                .requestMatchers(HttpMethod.GET, "/api/grading/mistakes/**")
                    .hasAnyRole("TUTOR", "STUDENT")
                .requestMatchers(HttpMethod.PATCH, "/api/grading/ocr-extractions/**")
                    .hasAnyRole("TUTOR", "STUDENT")
                .requestMatchers(HttpMethod.POST, "/api/grading/submission-documents")
                    .hasAnyRole("TUTOR", "STUDENT")
                .anyRequest().denyAll())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
