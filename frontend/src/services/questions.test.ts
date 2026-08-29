import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuestionApiError, addQuestionToWorksheetDraft, createTutorQuestion, fetchTutorQuestion, fetchTutorQuestions, isQuestionInWorksheetDraft, parseQuestionBankPage, parseTutorQuestion, updateTutorQuestion } from "./questions";

const response = {
  items: [{
    id: 7,
    code: "SCI-WATER-001",
    syllabusTopic: { id: 14, code: "SCI_P5_WATER", name: "Water", nodeType: "SUBTOPIC" },
    questionType: "OPEN_ENDED" as const,
    prompt: "Explain why evaporation happens faster on a hot day.",
    totalMarks: 2,
    archiveState: "ACTIVE" as const,
  }],
  page: 1,
  size: 12,
  totalElements: 13,
  totalPages: 2,
  hasNext: false,
};

const detailResponse = {
  ...response.items[0],
  modelAnswer: "Evaporation happens when water gains enough energy.",
  markingComponents: [{ position: 0, description: "Explains energy gain", marks: 2 }],
  keywords: ["evaporation"],
  createdAt: "2026-08-27T08:00:00",
  updatedAt: "2026-08-27T08:00:00",
};

const mutation = {
  code: "SCI-WATER-001", syllabusTopicId: 14, questionType: "OPEN_ENDED" as const, prompt: "Explain evaporation.", totalMarks: 2,
  modelAnswer: "Energy gain.", archiveState: "ACTIVE" as const, markingComponents: [{ description: "Explains energy", marks: 2 }], keywords: ["evaporation"],
};

describe("question bank service", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); sessionStorage.clear(); localStorage.clear(); });

  it("serializes combined filters and the Tutor bearer token", async () => {
    localStorage.setItem("jwt_token", "stored-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));

    await expect(fetchTutorQuestions({ topicId: 14, questionType: "OPEN_ENDED", archiveState: "ARCHIVED", search: "  Evaporation & state  ", page: 1, size: 12 })).resolves.toEqual(response);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/questions?page=1&size=12&topicId=14&questionType=OPEN_ENDED&archiveState=ARCHIVED&search=Evaporation+%26+state",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer stored-token", Accept: "application/json" }) }),
    );
  });

  it("uses the documented default page and size", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ...response, page: 0, size: 25 }), { status: 200 }));
    await fetchTutorQuestions();
    expect(fetch).toHaveBeenCalledWith("http://localhost:8083/api/learning/tutor/questions?page=0&size=25", expect.anything());
  });

  it("rejects invalid client filters before issuing an API request", async () => {
    await expect(fetchTutorQuestions({ topicId: 0 })).rejects.toMatchObject({ name: "QuestionApiError", status: 400 } satisfies Partial<QuestionApiError>);
    await expect(fetchTutorQuestions({ size: 101 })).rejects.toMatchObject({ status: 400 });
    await expect(fetchTutorQuestions({ questionType: "INVALID" as never })).rejects.toMatchObject({ status: 400 });
    await expect(fetchTutorQuestions({ search: "x".repeat(121) })).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("runtime-validates shallow question page payloads", () => {
    expect(parseQuestionBankPage(response)).toEqual(response);
    expect(() => parseQuestionBankPage({ ...response, items: [{ ...response.items[0], totalMarks: 0 }] })).toThrow("invalid question page");
    expect(() => parseQuestionBankPage({ ...response, items: [{ ...response.items[0], syllabusTopic: { id: 14 } }] })).toThrow("invalid question page");
    expect(() => parseQuestionBankPage({ ...response, hasNext: "false" })).toThrow("invalid question page");
  });

  it("keeps structured errors from the service", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "Question filters are invalid", fields: { page: "must be zero or greater" } }), { status: 400, headers: { "content-type": "application/json" } }));
    await expect(fetchTutorQuestions()).rejects.toMatchObject({ status: 400, fields: { page: "must be zero or greater" } });
  });

  it("loads and saves the full Tutor-only question payload", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(detailResponse), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(detailResponse), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(detailResponse), { status: 200 }));
    await expect(fetchTutorQuestion(7)).resolves.toEqual(detailResponse);
    await expect(createTutorQuestion(mutation)).resolves.toEqual(detailResponse);
    await expect(updateTutorQuestion(7, mutation)).resolves.toEqual(detailResponse);
    expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8083/api/learning/tutor/questions/7", expect.objectContaining({ headers: expect.anything() }));
    expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8083/api/learning/tutor/questions", expect.objectContaining({ method: "POST", body: JSON.stringify(mutation) }));
    expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8083/api/learning/tutor/questions/7", expect.objectContaining({ method: "PUT", body: JSON.stringify(mutation) }));
  });

  it("rejects malformed full payloads and invalid mutation values", async () => {
    expect(parseTutorQuestion(detailResponse)).toEqual(detailResponse);
    expect(() => parseTutorQuestion({ ...detailResponse, modelAnswer: "" })).toThrow("invalid question");
    await expect(createTutorQuestion({ ...mutation, markingComponents: [] })).rejects.toMatchObject({ status: 400 });
    await expect(updateTutorQuestion(0, mutation)).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps worksheet-draft question selections locally and de-duplicates retries", () => {
    expect(isQuestionInWorksheetDraft(7)).toBe(false);
    expect(addQuestionToWorksheetDraft(7)).toEqual({ ids: [7], added: true });
    expect(addQuestionToWorksheetDraft(7)).toEqual({ ids: [7], added: false });
    expect(isQuestionInWorksheetDraft(7)).toBe(true);
    expect(() => addQuestionToWorksheetDraft(0)).toThrow("Question reference is invalid");
  });

  it("reports browser storage failures without throwing from a worksheet selection", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("Storage blocked"); });
    expect(addQuestionToWorksheetDraft(7)).toEqual({ ids: [], added: false, storageUnavailable: true });
    expect(isQuestionInWorksheetDraft(7)).toBe(false);
  });
});
