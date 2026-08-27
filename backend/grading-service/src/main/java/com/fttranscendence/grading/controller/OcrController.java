package com.fttranscendence.grading.controller;

import com.fttranscendence.grading.service.AiOcrService;
import com.fttranscendence.grading.ocr.OcrExtraction;
import com.fttranscendence.grading.ocr.OcrReviewService;
import com.fttranscendence.grading.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/grading")
public class OcrController {

    private final AiOcrService aiOcrService; private final OcrReviewService reviews;

    public OcrController(AiOcrService aiOcrService, OcrReviewService reviews) {
        this.aiOcrService = aiOcrService; this.reviews=reviews;
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
    @PatchMapping("/ocr-extractions/{extractionId}")
    public ResponseEntity<Map<String,Object>> correct(@AuthenticationPrincipal AuthenticatedUser user,@PathVariable long extractionId,@RequestBody Map<String,String> request){ OcrExtraction e=reviews.correct(user.userId(),extractionId,request.get("correctedText")); return ResponseEntity.ok(Map.of("id",e.getId(),"text",e.getCorrectedText(),"confidence",e.getConfidence(),"status",e.getStatus().name())); }
}
