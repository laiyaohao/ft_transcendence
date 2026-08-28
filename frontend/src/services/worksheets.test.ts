import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStudentWorksheets, fetchTutorWorksheet, fetchTutorWorksheets, generateWorksheet, parseStudentWorksheet, parseTutorWorksheet, WorksheetApiError } from "./worksheets";

const worksheet = {
  id: 9, code: "GEN-9", title: "Water drill", instructions: null, audienceType: "CLASS", status: "DRAFT", generationRequestId: 3,
  questions: [{ id: 2, code: "Q-2", prompt: "Explain evaporation.", questionType: "OPEN_ENDED", totalMarks: 2, syllabusTopicId: 5, syllabusTopicName: "Water" }],
  assignments: [],
};

const studentWorksheet = {
  id: 18, code: "SCI-18", title: "Plant transport review",
  subjects: [{ id: 3, name: "Science" }], topics: [{ id: 9, name: "Plant transport" }],
  assignedAt: "2026-08-15T09:30:00", dueAt: "2026-08-25T23:59:00", status: "MARKED",
  submittedAt: "2026-08-20T12:00:00", reviewedAt: "2026-08-21T10:15:00",
  score: { earned: 8, available: 10, percent: 80 },
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

  it("loads only the student-scoped worksheet library with canonical filters and a bearer token", async () => {
    localStorage.setItem("jwt_token", "student-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([studentWorksheet]), { status: 200 }));

    await expect(fetchStudentWorksheets({ subjectId: 3, topicId: 9, status: "MARKED", assignedFrom: "2026-08-01", assignedTo: "2026-08-31" })).resolves.toEqual([studentWorksheet]);
    expect(fetch).toHaveBeenLastCalledWith(
      "http://localhost:8083/api/learning/student/worksheets?subjectId=3&topicId=9&status=MARKED&assignedFrom=2026-08-01&assignedTo=2026-08-31",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer student-token" }) }),
    );
  });

  it("strictly rejects an invalid student library response before it reaches the UI", async () => {
    expect(() => parseStudentWorksheet({ ...studentWorksheet, subjects: [] })).toThrow(/invalid student worksheet/i);
    expect(() => parseStudentWorksheet({ ...studentWorksheet, assignedAt: "2026-02-30T09:00:00" })).toThrow(/invalid student worksheet date/i);
    expect(() => parseStudentWorksheet({ ...studentWorksheet, score: { earned: 11, available: 10, percent: 110 } })).toThrow(/invalid student worksheet score/i);
    await expect(fetchStudentWorksheets({ status: "DRAFT" as never })).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
