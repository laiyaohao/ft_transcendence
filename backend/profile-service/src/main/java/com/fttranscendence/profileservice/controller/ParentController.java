package com.fttranscendence.profileservice.controller;

import com.fttranscendence.profileservice.dto.CreateParentRequest;
import com.fttranscendence.profileservice.dto.ParentDTO;
import com.fttranscendence.profileservice.dto.UpdateParentRequest;
import com.fttranscendence.profileservice.service.ParentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
public class ParentController {
  private final ParentService parentService;

  @PostMapping
  public ResponseEntity<ParentDTO> createParent(@Valid @RequestBody CreateParentRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(parentService.createParent(request));
  }

  @GetMapping("/user/{userId}")
  public ResponseEntity<ParentDTO> getParentByUserId(@PathVariable Long userId) {
    return ResponseEntity.ok(parentService.getParentByUserId(userId));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ParentDTO> getParentById(@PathVariable Long id) {
    return ResponseEntity.ok(parentService.getParentById(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ParentDTO> updateParent(
      @PathVariable Long id,
      @Valid @RequestBody UpdateParentRequest request) {
    return ResponseEntity.ok(parentService.updateParent(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteParent(@PathVariable Long id) {
    parentService.deleteParent(id);
    return ResponseEntity.noContent().build();
  }
}