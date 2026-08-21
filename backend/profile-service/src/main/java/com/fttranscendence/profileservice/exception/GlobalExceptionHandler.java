package com.fttranscendence.profileservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;

@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
    ErrorResponse error = new ErrorResponse(
      ex.getMessage(),
      HttpStatus.BAD_REQUEST.value(),
      LocalDateTime.now()
    );
    return ResponseEntity.badRequest().body(error);
  }
}