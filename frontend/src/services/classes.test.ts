import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ClassApiError,
  createTutorClass,
  fetchTutorClassDetail,
  fetchTutorClasses,
  parseTutorClass,
  parseTutorClassDetail,
  parseTutorClasses,
  updateTutorClass,
} from "./classes";

const classes = [{
  id: 12,
  tutorId: 7,
  className: "Primary 5 Science",
  subject: "Science",
  level: "Primary 5",
  status: "ACTIVE" as const,
  schedules: [{ dayOfWeek: "MONDAY", startTime: "16:00", endTime: "17:30" }],
}];

const mutation = {
  className: "Primary 5 Science",
  subject: "Science",
  level: "Primary 5",
  status: "ACTIVE" as const,
  schedules: [{ dayOfWeek: "MONDAY" as const, startTime: "16:00", endTime: "17:30" }],
};

const detail = {
  ...classes[0],
  students: [{ id: 80, fullName: "Bella Tan", overallMastery: 68, masteryRecordCount: 4 }],
  mastery: { averageScore: 68, recordCount: 4, studentsWithMastery: 1 },
  weakAreas: [{ topicId: 41, topicName: "Adaptation", averageScore: 45, affectedStudentCount: 1 }],
  insight: { status: "UNAVAILABLE" as const, message: "Insights are not available yet." },
  worksheets: [{ id: 31, title: "P5 Science — Adaptation Mini Test", status: "APPROVED" as const, dueAt: "2026-09-15T23:59:00+08:00", assignedAt: "2026-09-01T10:00:00+08:00" }],
};

describe("tutor class service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("requests the Tutor class list with the stored bearer token", async () => {
    localStorage.setItem("jwt_token", "stored-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(classes), { status: 200 }));

    await expect(fetchTutorClasses()).resolves.toEqual(classes);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/classes",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer stored-token",
        }),
      }),
    );
  });

  it("rejects a failed request with a recoverable message", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "Tutor access is required" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    }));

    await expect(fetchTutorClasses()).rejects.toThrow("Tutor access is required");
  });

  it("runtime-validates every required class and schedule field", () => {
    expect(parseTutorClasses(classes)).toEqual(classes);
    expect(() => parseTutorClasses([{ ...classes[0], id: 0 }])).toThrow("invalid class list");
    expect(() => parseTutorClasses([{ ...classes[0], status: "ARCHIVED" }])).toThrow("invalid class list");
    expect(() => parseTutorClasses([{ ...classes[0], schedules: [{ dayOfWeek: "MONDAY", startTime: 1600, endTime: "17:30" }] }])).toThrow("invalid class list");
    expect(() => parseTutorClasses({ classes })).toThrow("invalid class list");
  });

  it("surfaces an invalid successful response instead of trusting it", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([{ id: 12 }]), { status: 200 }));

    await expect(fetchTutorClasses()).rejects.toThrow("invalid class list");
  });

  it("requests a single owner-scoped class detail with the stored bearer token", async () => {
    localStorage.setItem("jwt_token", "stored-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(detail), { status: 200 }));

    await expect(fetchTutorClassDetail(12)).resolves.toEqual(detail);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/classes/12",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer stored-token" }) }),
    );
  });

  it("preserves missing and wrong-owner detail responses", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      code: "CLASS_NOT_FOUND", message: "Class 12 was not found for this tutor", fields: {},
    }), { status: 404, headers: { "content-type": "application/json" } }));

    await expect(fetchTutorClassDetail(12)).rejects.toMatchObject({ status: 404, message: "Class 12 was not found for this tutor" });
  });

  it("runtime-validates full and partial class detail data", () => {
    expect(parseTutorClassDetail(detail)).toEqual(detail);
    expect(parseTutorClassDetail({
      ...detail,
      students: [],
      mastery: { averageScore: null, recordCount: 0, studentsWithMastery: 0 },
      weakAreas: [],
      worksheets: [],
    })).toMatchObject({ students: [], weakAreas: [], worksheets: [] });
    expect(() => parseTutorClassDetail({ ...detail, insight: { status: "READY", message: "No" } })).toThrow("invalid class details");
    expect(() => parseTutorClassDetail({ ...detail, weakAreas: [{ ...detail.weakAreas[0], averageScore: 101 }] })).toThrow("invalid class details");
  });

  it("rejects invalid class references before making a request", async () => {
    await expect(fetchTutorClassDetail(0)).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("creates a class with the stored Tutor bearer token and complete JSON body", async () => {
    localStorage.setItem("jwt_token", "stored-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(classes[0]), { status: 201 }));

    await expect(createTutorClass(mutation)).resolves.toEqual(classes[0]);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/classes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(mutation),
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer stored-token",
        }),
      }),
    );
  });

  it("updates the selected class through the owner-scoped endpoint", async () => {
    const updated = { ...classes[0], className: "Primary 5 Advanced Science" };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(updated), { status: 200 }));

    await expect(updateTutorClass(12, { ...mutation, className: updated.className })).resolves.toEqual(updated);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/classes/12",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("preserves structured server rejections, including a wrong-owner response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      code: "CLASS_NOT_FOUND",
      message: "Class 12 was not found for this tutor",
      fields: {},
    }), { status: 404, headers: { "content-type": "application/json" } }));

    await expect(updateTutorClass(12, mutation)).rejects.toMatchObject({
      name: "ClassApiError",
      status: 404,
      message: "Class 12 was not found for this tutor",
    } satisfies Partial<ClassApiError>);
  });

  it("exposes structured validation field errors to the form", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      code: "VALIDATION_FAILED",
      message: "Class request is invalid",
      fields: { className: "must not be blank" },
    }), { status: 400, headers: { "content-type": "application/json" } }));

    await expect(createTutorClass(mutation)).rejects.toMatchObject({
      fields: { className: "must not be blank" },
    });
  });

  it("runtime-validates successful mutation responses", () => {
    expect(parseTutorClass(classes[0])).toEqual(classes[0]);
    expect(() => parseTutorClass({ id: 12 })).toThrow("invalid class");
  });
});
