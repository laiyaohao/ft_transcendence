package com.yourteam.authservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/actuator")
public class HealthController {

  @GetMapping("/health")
  public Map<String, String> healthCheck() {
    Map<String, String> status = new HashMap<>();
    status.put("status", "UP");
    status.put("service", "auth-service");
    return status;
  }
}