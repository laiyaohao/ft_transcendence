import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  StudentApiError,
  createTutorStudent,
  fetchTutorStudents,
  parseTutorStudent,
  parseTutorStudents,
  updateTutorStudent,
} from "./students";

const students = [{
  id: 31,
  tutorId: 7,
  fullName: "Bella Tan",
  loginUserId: null,
  classes: [{ id: 12, className: "Primary 5 Science", subject: "Science", level: "Primary 5" }],
  createdAt: "2026-09-02T10:00:00",
  updatedAt: "2026-09-02T10:00:00",
}];

const mutation = { fullName: "Bella Tan", classIds: [12] };

describe("tutor student service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("requests the owner-scoped student list with the stored bearer token", async () => {
    localStorage.setItem("jwt_token", "stored-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(students), { status: 200 }));

    await expect(fetchTutorStudents()).resolves.toEqual(students);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/students",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer stored-token" }) }),
    );
  });

  it("rejects failed owner-scoped requests with the server message", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "Tutor access is required" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    }));

    await expect(fetchTutorStudents()).rejects.toMatchObject({ status: 403, message: "Tutor access is required" });
  });

  it("runtime-validates student and membership response fields", () => {
    expect(parseTutorStudents(students)).toEqual(students);
    expect(() => parseTutorStudents([{ ...students[0], id: 0 }])).toThrow("invalid student list");
    expect(() => parseTutorStudents([{ ...students[0], classes: [{ id: 12, className: "P5", subject: "Science" }] }])).toThrow("invalid student list");
    expect(() => parseTutorStudent({ ...students[0], createdAt: null })).toThrow("invalid student");
    expect(() => parseTutorStudents({ students })).toThrow("invalid student list");
  });

  it("creates a student with unique class memberships in the JSON request", async () => {
    localStorage.setItem("jwt_token", "stored-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(students[0]), { status: 201 }));

    await expect(createTutorStudent(mutation)).resolves.toEqual(students[0]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/students",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(mutation),
        headers: expect.objectContaining({ "Content-Type": "application/json", Authorization: "Bearer stored-token" }),
      }),
    );
  });

  it("updates a selected student and rejects invalid references before a request", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(students[0]), { status: 200 }));
    await expect(updateTutorStudent(31, mutation)).resolves.toEqual(students[0]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/students/31",
      expect.objectContaining({ method: "PUT" }),
    );

    vi.mocked(fetch).mockClear();
    await expect(updateTutorStudent(0, mutation)).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves structured validation, duplicate membership, and wrong-owner errors", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      message: "Each class can be selected only once",
      fields: { classIds: "Remove the duplicate class." },
    }), { status: 400, headers: { "content-type": "application/json" } }));
    await expect(createTutorStudent({ ...mutation, classIds: [12, 12] })).rejects.toMatchObject({
      name: "StudentApiError",
      fields: { classIds: "Remove the duplicate class." },
    } satisfies Partial<StudentApiError>);

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      message: "Student 31 was not found for this tutor",
      fields: {},
    }), { status: 404, headers: { "content-type": "application/json" } }));
    await expect(updateTutorStudent(31, mutation)).rejects.toMatchObject({ status: 404, message: "Student 31 was not found for this tutor" });
  });

  it("does not trust malformed successful mutation responses", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 31 }), { status: 200 }));
    await expect(createTutorStudent(mutation)).rejects.toThrow("invalid student");
  });
});
