package com.fttranscendence.learning.pdf;

import com.fttranscendence.learning.question.Question;
import com.fttranscendence.learning.worksheet.Worksheet;
import com.fttranscendence.learning.worksheet.WorksheetQuestion;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

/** Renders the printable student-facing form of an approved worksheet. */
@Service
public class PdfDocumentService {
    private static final PDRectangle PAGE_SIZE = PDRectangle.A4;
    private static final float MARGIN = 54;
    private static final float BODY_SIZE = 11;
    private static final float BODY_LEADING = 15;
    private static final float HEADING_SIZE = 18;
    private static final float SUBHEADING_SIZE = 12;

    private final PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private final PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

    public byte[] createWorksheetPdf(Worksheet worksheet) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            applyMetadata(document, worksheet);
            PageWriter writer = new PageWriter(document);
            writer.heading(worksheet.getTitle());
            writer.body("Worksheet code: " + worksheet.getCode());
            if (worksheet.getInstructions() != null && !worksheet.getInstructions().isBlank()) {
                writer.spacer(6);
                writer.boldBody("Instructions");
                writer.body(worksheet.getInstructions());
            }
            writer.spacer(10);

            int number = 1;
            for (WorksheetQuestion worksheetQuestion : worksheet.getQuestions()) {
                Question question = worksheetQuestion.getQuestion();
                writer.question(number++, question.getPrompt(), question.getQuestionType(), question.getTotalMarks());
            }
            writer.finish();
            document.save(bytes);
            return bytes.toByteArray();
        } catch (IOException exception) {
            throw new PdfGenerationException("Unable to generate the worksheet PDF.", exception);
        }
    }

    private void applyMetadata(PDDocument document, Worksheet worksheet) {
        PDDocumentInformation metadata = document.getDocumentInformation();
        metadata.setTitle(worksheet.getTitle());
        metadata.setSubject("Worksheet " + worksheet.getCode());
        metadata.setAuthor("ft_transcendence");
        metadata.setCreator("ft_transcendence learning service");
        metadata.setKeywords("worksheet," + worksheet.getCode());
    }

    private final class PageWriter {
        private final PDDocument document;
        private PDPageContentStream content;
        private float y;

        private PageWriter(PDDocument document) throws IOException {
            this.document = document;
            startPage();
        }

        private void startPage() throws IOException {
            if (content != null) content.close();
            document.addPage(new PDPage(PAGE_SIZE));
            content = new PDPageContentStream(document, document.getPage(document.getNumberOfPages() - 1));
            y = PAGE_SIZE.getHeight() - MARGIN;
            content.beginText();
            content.setFont(regular, 8);
            content.newLineAtOffset(MARGIN, 28);
            content.showText("Worksheet");
            content.endText();
        }

        private void heading(String value) throws IOException {
            writeLines(wrap(value, bold, HEADING_SIZE), bold, HEADING_SIZE, HEADING_SIZE + 7);
        }

        private void boldBody(String value) throws IOException {
            writeLines(wrap(value, bold, SUBHEADING_SIZE), bold, SUBHEADING_SIZE, BODY_LEADING);
        }

        private void body(String value) throws IOException {
            writeLines(wrap(value, regular, BODY_SIZE), regular, BODY_SIZE, BODY_LEADING);
        }

        private void question(int number, String prompt, Question.QuestionType type, BigDecimal marks) throws IOException {
            writeLines(wrap(number + ". " + prompt, bold, BODY_SIZE), bold, BODY_SIZE, BODY_LEADING);
            String details = "Type: " + readableType(type) + (marks == null ? "" : "  *  Marks: " + marks.stripTrailingZeros().toPlainString());
            writeLines(wrap(details, regular, 9), regular, 9, 12);
            int answerLines = switch (type) {
                case TRUE_FALSE, MULTIPLE_CHOICE -> 2;
                case FILL_IN_THE_BLANK -> 3;
                default -> 5;
            };
            for (int line = 0; line < answerLines; line++) {
                ensureSpace(13);
                content.moveTo(MARGIN, y - 7);
                content.lineTo(PAGE_SIZE.getWidth() - MARGIN, y - 7);
                content.stroke();
                y -= 13;
            }
            spacer(12);
        }

        private void spacer(float height) throws IOException {
            ensureSpace(height);
            y -= height;
        }

        private void writeLines(List<String> lines, PDFont font, float fontSize, float leading) throws IOException {
            for (String line : lines) {
                ensureSpace(leading);
                content.beginText();
                content.setFont(font, fontSize);
                content.newLineAtOffset(MARGIN, y);
                content.showText(line);
                content.endText();
                y -= leading;
            }
        }

        private void ensureSpace(float requiredHeight) throws IOException {
            if (y - requiredHeight < MARGIN) startPage();
        }

        private void finish() throws IOException {
            if (content != null) content.close();
            content = null;
        }
    }

    private List<String> wrap(String input, PDFont font, float fontSize) throws IOException {
        String text = printableText(input == null ? "" : input);
        if (text.isBlank()) return List.of("");
        float maximumWidth = PAGE_SIZE.getWidth() - (2 * MARGIN);
        List<String> lines = new ArrayList<>();
        for (String paragraph : text.split("\\R", -1)) {
            if (paragraph.isBlank()) {
                lines.add("");
                continue;
            }
            StringBuilder line = new StringBuilder();
            for (String word : paragraph.split("\\s+")) {
                String candidate = line.isEmpty() ? word : line + " " + word;
                if (font.getStringWidth(candidate) / 1000 * fontSize <= maximumWidth) {
                    line.setLength(0);
                    line.append(candidate);
                } else if (line.isEmpty()) {
                    lines.add(word);
                } else {
                    lines.add(line.toString());
                    line.setLength(0);
                    line.append(word);
                }
            }
            if (!line.isEmpty()) lines.add(line.toString());
        }
        return lines;
    }

    private String printableText(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFKD)
            .replace('\u2018', '\'').replace('\u2019', '\'').replace('\u201C', '"').replace('\u201D', '"')
            .replace('\u2013', '-').replace('\u2014', '-').replace('\u2022', '*');
        StringBuilder printable = new StringBuilder(normalized.length());
        for (int index = 0; index < normalized.length(); index++) {
            char character = normalized.charAt(index);
            if (character == '\n' || character == '\r' || character == '\t' || (character >= 32 && character <= 126)) {
                printable.append(character);
            }
        }
        return printable.toString();
    }

    private String readableType(Question.QuestionType type) {
        return type.name().toLowerCase(java.util.Locale.ROOT).replace('_', ' ');
    }

    public static class PdfGenerationException extends RuntimeException {
        PdfGenerationException(String message, Throwable cause) { super(message, cause); }
    }
}
