package com.fttranscendence.learning.security;

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
    private final byte[] signingKey;
    private final StudentProfileProvisioningService profiles;

    public JwtAuthenticationFilter(@Value("${jwt.secret}") String secret, StudentProfileProvisioningService profiles) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes");
        }
        this.signingKey = secret.getBytes(StandardCharsets.UTF_8);
        this.profiles = profiles;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(signingKey))
                .build()
                .parseClaimsJws(authorization.substring(7))
                .getBody();
            String email = claims.getSubject();
            String role = claims.get("role", String.class);
            String fullName = claims.get("fullName", String.class);
            Number userIdClaim = claims.get("userId", Number.class);

            if (StringUtils.hasText(email)
                    && ALLOWED_ROLES.contains(role)
                    && userIdClaim != null
                    && userIdClaim.longValue() > 0
                    && SecurityContextHolder.getContext().getAuthentication() == null) {
                AuthenticatedUser principal = new AuthenticatedUser(
                    userIdClaim.longValue(), email, role, StringUtils.hasText(fullName) ? fullName : email);
                var authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                if ("STUDENT".equals(role)) {
                    profiles.ensureProfile(principal);
                }
            }
        } catch (RuntimeException ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
