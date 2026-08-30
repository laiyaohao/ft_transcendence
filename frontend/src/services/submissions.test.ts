import { beforeEach, describe, expect, it, vi } from "vitest"; import { MAX_UPLOAD_BYTES, approveMarkingReview, createManualResult, createManualResults, createMarkingReview, createOcrDocument, fetchManualResults, fetchMarkingReview, fetchStudentMistakes, fetchStudentWorksheetResults, parseMarkingReview, parseStudentMistakeReviews, parseStudentWorksheetResultsResponse, validateUploadFiles } from "./submissions";
const file = (name: string, type = "image/jpeg", size = 4) => new File([new Uint8Array(size)], name, { type, lastModified: 1 });
describe("submissions service", () => { beforeEach(() => { vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:page"), revokeObjectURL: vi.fn() }); vi.stubGlobal("fetch", vi.fn()); }); it("accepts images and PDFs while rejecting invalid, duplicate, empty and oversized files", () => { const first = file("one.jpg"); expect(validateUploadFiles([first, file("two.pdf", "application/pdf")]).pages).toHaveLength(2); expect(validateUploadFiles([first], validateUploadFiles([first]).pages).errors[0]).toMatch(/already/); expect(validateUploadFiles([file("bad.gif", "image/gif"), file("empty.jpg", "image/jpeg", 0), file("large.jpg", "image/jpeg", MAX_UPLOAD_BYTES + 1)]).errors).toHaveLength(3); }); it("creates one durable submission document with its selected context and pages", async () => { const pages = validateUploadFiles([file("one.jpg"), file("two.png", "image/png")]).pages; vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 7, classId: 3, studentId: 2, worksheetId: 1, uploadedByTutorId: 9, status: "READY", createdAt: "2026-08-30T09:00:00", pages: [{ id: 11, extractionId: 12, text: "answer", confidence: .8, status: "READY" }] }), { status: 201 })); await expect(createOcrDocument({ classId: 3, studentId: 2, worksheetId: 1, pages })).resolves.toMatchObject({ id: 7, classId: 3, studentId: 2, worksheetId: 1 }); const [, request] = vi.mocked(fetch).mock.calls[0]!; expect(request).toMatchObject({ method: "POST" }); const form = (request as RequestInit).body as FormData; expect(form.get("classId")).toBe("3"); expect(form.getAll("files")).toHaveLength(2); }); it("loads and validates tutor marking reviews before approval", async () => { const review = { id: 1, studentId: 2, worksheetId: 3, worksheetQuestionId: 4, questionBankId: 5, extractedAnswer: "Answer", modelAnswer: "Model", maxMarks: 2, aiSuggestedMarks: 1, aiSuggestedOutcome: "Partial", aiErrorCategory: null, missingKeywords: [], aiSuggestedFeedback: "Feedback", reviewStatus: "PENDING_REVIEW", approvedMarks: null, approvedFeedback: null, reviewedByUserId: null, reviewedAt: null, providerResponseValid: true, diagnosticEvidence: [], history: [] }; vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(review), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ ...review, reviewStatus: "APPROVED", approvedMarks: 2, approvedFeedback: "Tutor feedback" }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify(review), { status: 201 })); await expect(fetchMarkingReview(1)).resolves.toMatchObject({ id: 1, reviewStatus: "PENDING_REVIEW" }); await expect(approveMarkingReview(1, 2, "Tutor feedback", [{ mistakeType: "CONCEPT_MISUNDERSTANDING", description: "Tutor confirmed a concept gap.", missingKeywords: ["heat transfer"] }])).resolves.toMatchObject({ diagnosticEvidence: [] }); expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining("/approve"), expect.objectContaining({ body: JSON.stringify({ marks: 2, feedback: "Tutor feedback", diagnosticEvidence: [{ mistakeType: "CONCEPT_MISUNDERSTANDING", description: "Tutor confirmed a concept gap.", missingKeywords: ["heat transfer"] }] }) })); await expect(createMarkingReview({ submissionDocumentId: 8, worksheetQuestionId: 4, questionBankId: 5 })).resolves.toMatchObject({ id: 1 }); expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining("/tutor/reviews"), expect.objectContaining({ method: "POST" })); expect(() => parseMarkingReview({ id: 1 })).toThrow(/invalid/i); }); });

describe("Student submission document client", () => {
  beforeEach(() => { vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:page"), revokeObjectURL: vi.fn() }); vi.stubGlobal("fetch", vi.fn()); localStorage.setItem("jwt_token", "student-token"); });

  it("omits class context for a Student-owned assigned-worksheet upload", async () => {
    const pages = validateUploadFiles([file("answer.png", "image/png")]).pages;
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 8, classId: null, studentId: 7, worksheetId: 42, uploadedByTutorId: null, status: "READY", createdAt: "2026-08-30T09:00:00", pages: [{ id: 11, extractionId: 12, text: "answer", confidence: .8, status: "REQUIRES_REVIEW" }] }), { status: 201 }));
    await expect(createOcrDocument({ studentId: 7, worksheetId: 42, pages })).resolves.toMatchObject({ id: 8, studentId: 7, worksheetId: 42 });
    const [, request] = vi.mocked(fetch).mock.calls[0]!;
    const form = (request as RequestInit).body as FormData;
    expect((request as RequestInit).headers).toEqual({ Authorization: "Bearer student-token" });
    expect(form.has("classId")).toBe(false);
    expect(form.get("studentId")).toBe("7");
    expect(form.get("worksheetId")).toBe("42");
  });
});

describe("student worksheet results client", () => {
  const approved = { submissionId: 10, worksheetQuestionId: 20, questionBankId: 30, answer: "Student answer", modelAnswer: "Model answer", maximumMarks: 2, reviewStatus: "APPROVED", outcome: "PARTIAL", awardedMarks: 1, explanation: "Use the subject term.", reviewedAt: "2026-08-29T09:00:00" };

  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); localStorage.clear(); });

  it("uses the authenticated Student results endpoint and rejects leaked final data before approval", async () => {
    localStorage.setItem("jwt_token", "student-token");
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ worksheetId: 7, results: [approved] }), { status: 200 }));
    await expect(fetchStudentWorksheetResults(7)).resolves.toMatchObject({ worksheetId: 7, results: [{ outcome: "PARTIAL", reviewStatus: "APPROVED" }] });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/grading/student/worksheets/7/results"), expect.objectContaining({ headers: { Authorization: "Bearer student-token" } }));
    expect(() => parseStudentWorksheetResultsResponse({ worksheetId: 7, results: [{ ...approved, reviewStatus: "PENDING_REVIEW", awardedMarks: null, explanation: null, modelAnswer: "Leaked answer" }] })).toThrow(/invalid/i);
  });
});

describe("student mistake review client", () => {
  const confirmed = { id: 1, worksheetId: 2, worksheetQuestionId: 3, questionBankId: 4, syllabusTopicId: 5, syllabusTopicCode: "SCI-5", mistakeType: "WRONG_UNITS", mistakeLabel: "Wrong units", description: "Units were omitted.", recordedAt: "2026-08-29T09:00:00Z", subjectId: 6, subjectName: "Science", topicName: "Forces", occurrenceCount: 2, status: "CONFIRMED" };
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); localStorage.clear(); });

  it("uses authenticated server filters and rejects malformed or non-confirmed review records", async () => {
    localStorage.setItem("jwt_token", "student-token");
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([confirmed]), { status: 200 }));
    await expect(fetchStudentMistakes({ subjectId: 6, topicId: 5, mistakeType: "WRONG_UNITS", worksheetId: 2, from: "2026-08-01", to: "2026-08-31" })).resolves.toMatchObject([{ occurrenceCount: 2, status: "CONFIRMED" }]);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/grading/student/mistakes?subjectId=6&topicId=5&mistakeType=WRONG_UNITS&worksheetId=2&from=2026-08-01&to=2026-08-31"), expect.objectContaining({ headers: { Authorization: "Bearer student-token" } }));
    expect(() => parseStudentMistakeReviews([{ ...confirmed, status: "PENDING_REVIEW" }])).toThrow(/invalid/i);
    await expect(fetchStudentMistakes({ worksheetId: 0 })).rejects.toMatchObject({ status: 400 });
  });
});

describe("manual result client", () => {
  it("posts a validated manual result and rejects missing required values locally", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1, studentId: 2, worksheetId: 3, worksheetQuestionId: 5, questionBankId: 5, extractedAnswer: "Answer", modelAnswer: "Model", maxMarks: 2, aiSuggestedMarks: null, aiSuggestedOutcome: null, aiErrorCategory: null, missingKeywords: [], aiSuggestedFeedback: null, reviewStatus: "APPROVED", approvedMarks: 1.5, approvedFeedback: "Tutor feedback", reviewedByUserId: 1, reviewedAt: "2026-08-27T10:00:00", providerResponseValid: null, diagnosticEvidence: [], history: [] }), { status: 201 })));
    await expect(createManualResult({ worksheetId: 3, studentId: 2, questionBankId: 5, answer: "Answer", marks: 1.5, feedback: "Tutor feedback" })).resolves.toMatchObject({ reviewStatus: "APPROVED" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/tutor/reviews/manual"), expect.objectContaining({ method: "POST" }));
    await expect(createManualResult({ worksheetId: 3, studentId: 2, questionBankId: 5, answer: "", marks: 1.5, feedback: "Tutor feedback" })).rejects.toMatchObject({ status: 400 });
  });

  it("uses the batch contract and validates the owner-scoped progress response", async () => {
    const review = { id: 1, studentId: 2, worksheetId: 3, worksheetQuestionId: 5, questionBankId: 5, extractedAnswer: "Answer", modelAnswer: "Model", maxMarks: 2, aiSuggestedMarks: null, aiSuggestedOutcome: null, aiErrorCategory: null, missingKeywords: [], aiSuggestedFeedback: null, reviewStatus: "APPROVED", approvedMarks: 1.5, approvedFeedback: "Tutor feedback", reviewedByUserId: 1, reviewedAt: "2026-08-27T10:00:00", providerResponseValid: null, diagnosticEvidence: [], history: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([review]), { status: 201 })).mockResolvedValueOnce(new Response(JSON.stringify({ worksheetId: 3, students: [{ studentId: 2, completedQuestions: 1, results: [review] }] }), { status: 200 })));
    await expect(createManualResults({ worksheetId: 3, studentId: 2, entries: [{ questionBankId: 5, answer: "Answer", marks: 1.5, feedback: "Tutor feedback" }] })).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining("/tutor/reviews/manual/batch"), expect.objectContaining({ method: "POST" }));
    await expect(fetchManualResults(3)).resolves.toMatchObject({ worksheetId: 3, students: [{ studentId: 2, completedQuestions: 1 }] });
    await expect(createManualResults({ worksheetId: 3, studentId: 2, entries: [] })).rejects.toMatchObject({ status: 400 });
  });
});
