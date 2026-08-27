import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTutorWorksheet, fetchTutorWorksheets, generateWorksheet, parseTutorWorksheet, WorksheetApiError } from "./worksheets";

const worksheet = {
  id: 9, code: "GEN-9", title: "Water drill", instructions: null, audienceType: "CLASS", status: "DRAFT", generationRequestId: 3,
  questions: [{ id: 2, code: "Q-2", prompt: "Explain evaporation.", questionType: "OPEN_ENDED", totalMarks: 2, syllabusTopicId: 5, syllabusTopicName: "Water" }],
  assignments: [],
};

describe("worksheet service", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); localStorage.clear(); });

  it("sends an idempotent tutor generation request and normalises its draft", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 1, classId: 2, status: "SUCCEEDED", failureMessage: null, worksheet }), { status: 201 }));
    const result = await generateWorksheet(2, { targetMode: "CLASS", topicIds: [3], questionCount: 5 }, "key-1");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/classes/2/worksheet-generation-requests"), expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "key-1" }) }));
    expect(result.worksheet?.targetMode).toBe("CLASS");
  });

  it("loads the owner-scoped worksheet with questions and assignments", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ...worksheet, status: "APPROVED", assignments: [{ id: 4, assignmentType: "CLASS", classId: 2, studentProfileId: null, assignedAt: "2026-08-27T10:00:00", dueAt: "2026-09-01T10:00:00" }] }), { status: 200 }));
    await expect(fetchTutorWorksheet(9)).resolves.toMatchObject({ id: 9, dueAt: "2026-09-01T10:00:00", targetMode: "CLASS" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/worksheets/9"), expect.anything());
  });

  it("rejects invalid worksheet responses and invalid configurations before a request", async () => {
    expect(() => parseTutorWorksheet({ id: 1 })).toThrow(/invalid worksheet/i);
    await expect(generateWorksheet(0, { targetMode: "CLASS", topicIds: [], questionCount: 0 }, "x")).rejects.toBeInstanceOf(WorksheetApiError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("lists worksheets with an optional owner-scoped class filter", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([worksheet]), { status: 200 }));
    await expect(fetchTutorWorksheets(2)).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining("/api/learning/tutor/worksheets?classId=2"), expect.anything());
  });
});
