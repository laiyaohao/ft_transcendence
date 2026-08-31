package com.fttranscendence.grading.ocr;

import com.fttranscendence.grading.model.SubmissionPage;
import com.fttranscendence.grading.model.SubmissionDocument;
import com.fttranscendence.grading.repository.OcrExtractionRepository;
import com.fttranscendence.grading.service.AiOcrService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class OcrReviewService {
  private final OcrExtractionRepository extractions; private final AiOcrService ocr;
  public OcrReviewService(OcrExtractionRepository extractions, AiOcrService ocr){this.extractions=extractions;this.ocr=ocr;}
  @Transactional public OcrExtraction extract(SubmissionPage page, Long questionId, byte[] bytes){ AiOcrService.OcrResult result=ocr.extract(bytes, page.getMediaType()); return extractions.save(new OcrExtraction(page,questionId,result.unreadable()?"":result.text(),result.confidence(),"ai-vision")); }
  @Transactional public OcrExtraction correct(long ownerId,String ownerRole,long extractionId,String text){ OcrExtraction e=extractions.findById(extractionId).orElseThrow(NotFound::new); SubmissionDocument.OwnerRole role; try { role=SubmissionDocument.OwnerRole.valueOf(ownerRole); } catch(RuntimeException exception) { throw new NotFound(); } if(!e.getPage().getDocument().getOwnerUserId().equals(ownerId)||e.getPage().getDocument().getOwnerRole()!=role)throw new NotFound(); if(e.getPage().getDocument().getStatus()!=SubmissionDocument.Status.READY)throw new IllegalStateException("Submitted OCR cannot be changed."); if(text==null||text.isBlank())throw new IllegalArgumentException("Corrected text is required."); e.correct(text); return e; }
  public static class NotFound extends RuntimeException {}
}
