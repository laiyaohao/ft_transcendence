package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.pdf.PdfDocumentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Applies worksheet access and lifecycle rules before rendering a PDF. */
@Service
public class WorksheetPdfService {
    private final WorksheetRepository worksheets;
    private final PdfDocumentService pdfDocuments;

    public WorksheetPdfService(WorksheetRepository worksheets, PdfDocumentService pdfDocuments) {
        this.worksheets = worksheets;
        this.pdfDocuments = pdfDocuments;
    }

    @Transactional(readOnly = true)
    public PdfExport export(long tutorId, long worksheetId) {
        Worksheet worksheet = worksheets.findByIdAndTutorId(worksheetId, tutorId)
            .orElseThrow(WorksheetService.WorksheetNotFoundException::new);
        if (worksheet.getStatus() != Worksheet.Status.APPROVED) throw new WorksheetNotApprovedException();
        return new PdfExport(pdfDocuments.createWorksheetPdf(worksheet), filename(worksheet));
    }

    private String filename(Worksheet worksheet) {
        return "worksheet-" + worksheet.getCode().replaceAll("[^A-Za-z0-9._-]", "_") + ".pdf";
    }

    public record PdfExport(byte[] bytes, String filename) { }

    public static class WorksheetNotApprovedException extends RuntimeException { }
}
