package com.fttranscendence.profileservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.fttranscendence.profileservice.config.FeignConfig;

@FeignClient(
    name = "auth-service",
    url = "${auth.service.url:http://localhost:8081}",
    configuration = FeignConfig.class
)
public interface AuthServiceClient {
    
  @GetMapping("/api/users/exists/{id}")
  boolean userExists(@PathVariable("id") Long id);
  
  @GetMapping("/api/users/{id}")
  UserDTO getUserById(@PathVariable("id") Long id);
}