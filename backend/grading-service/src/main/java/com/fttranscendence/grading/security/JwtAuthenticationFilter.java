package com.fttranscendence.grading.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final Set<String> ALLOWED_ROLES = Set.of("TUTOR", "STUDENT");
  private final String secret;

  public JwtAuthenticationFilter(@Value("${jwt.secret}") String secret) {
    this.secret = secret;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    String authorization = request.getHeader("Authorization");
    if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      Claims claims = Jwts.parserBuilder()
          .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
          .build()
          .parseClaimsJws(authorization.substring(7))
          .getBody();
      String subject = claims.getSubject();
      String role = claims.get("role", String.class);

      if (StringUtils.hasText(subject)
          && ALLOWED_ROLES.contains(role)
          && SecurityContextHolder.getContext().getAuthentication() == null) {
        var authentication = new UsernamePasswordAuthenticationToken(
            subject,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    } catch (RuntimeException ex) {
      SecurityContextHolder.clearContext();
    }

    filterChain.doFilter(request, response);
  }
}
