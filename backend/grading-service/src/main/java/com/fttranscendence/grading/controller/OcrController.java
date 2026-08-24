package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.service.AiOcrService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/grading")
public class OcrController {

    private final AiOcrService aiOcrService;

    public OcrController(AiOcrService aiOcrService) {
        this.aiOcrService = aiOcrService;
    }

    @PostMapping("/ocr")
    public ResponseEntity<Map<String, String>> extractText(@RequestParam("file") MultipartFile file) {
        try {
            // Convert the uploaded image into a Base64 string
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            
            // Send to Groq Vision Model
            String extractedText = aiOcrService.extractTextFromImage(base64Image);
            
            // Return as JSON
            return ResponseEntity.ok(Map.of("extracted_text", extractedText));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to process image file."));
        }
    }
}