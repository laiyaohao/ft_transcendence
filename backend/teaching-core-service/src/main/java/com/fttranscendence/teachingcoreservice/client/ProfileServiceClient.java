package com.fttranscendence.teachingcoreservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "profile-service", url = "${profile.service.url:http://localhost:8082}")
public interface ProfileServiceClient {
    
    @GetMapping("/api/tutors/{id}")
    TutorDTO getTutorById(@PathVariable("id") Long id);
    
    @GetMapping("/api/students/{id}")
    StudentDTO getStudentById(@PathVariable("id") Long id);
    
    @GetMapping("/api/tutors/user/{userId}")
    TutorDTO getTutorByUserId(@PathVariable("userId") Long userId);
    
    @GetMapping("/api/students/user/{userId}")
    StudentDTO getStudentByUserId(@PathVariable("userId") Long userId);
}