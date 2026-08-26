import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchTutorClasses, parseTutorClasses } from "./classes";

const classes = [{
  id: 12,
  tutorId: 7,
  className: "Primary 5 Science",
  subject: "Science",
  level: "Primary 5",
  status: "ACTIVE" as const,
  schedules: [{ dayOfWeek: "MONDAY", startTime: "16:00", endTime: "17:30" }],
}];

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
});
