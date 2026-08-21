package com.fttranscendence.profileservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import com.fttranscendence.profileservice.security.AuthenticatedUser;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtService jwtService;

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain) throws ServletException, IOException {
    final String authHeader = request.getHeader("Authorization");

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    // final String jwt = authHeader.substring(7);
    // final String userEmail = jwtService.extractEmail(jwt);

    // if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
    //   if (jwtService.isTokenValid(jwt)) {
    //     // Create authentication without user details (we don't have the User entity
    //     // here)
    //     UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userEmail, null,
    //         new ArrayList<>());
    //     authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    //     SecurityContextHolder.getContext().setAuthentication(authToken);
    //   }
    // }
    // filterChain.doFilter(request, response);
    try {
      final String jwt = authHeader.substring(7);

      if (jwtService.isTokenValid(jwt)
          && SecurityContextHolder.getContext().getAuthentication() == null) {

        String email = jwtService.extractEmail(jwt);
        Long userId = jwtService.extractUserId(jwt);
        String role = jwtService.extractRole(jwt);

        AuthenticatedUser authenticatedUser =
            new AuthenticatedUser(userId, email, role);

        String authority = "ROLE_" + role.toUpperCase(Locale.ROOT);

        UsernamePasswordAuthenticationToken authToken =
            new UsernamePasswordAuthenticationToken(
                authenticatedUser,
                null,
                List.of(new SimpleGrantedAuthority(authority))
            );

        authToken.setDetails(
            new WebAuthenticationDetailsSource().buildDetails(request)
        );

        SecurityContextHolder.getContext().setAuthentication(authToken);
      }
    } catch (Exception exception) {
      SecurityContextHolder.clearContext();
    }
    filterChain.doFilter(request, response);
  }
}