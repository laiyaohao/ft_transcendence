import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchProgressReport,
  parseProgressReport,
  ReportApiError,
} from "./reports";

const report = {
  id: 12,
  studentId: 7,
  studentName: "Bella Tan",
  reportCode: "P5-SCI-T2",
  periodStart: "2026-04-01",
  periodEnd: "2026-06-30",
  status: "FINAL" as const,
  snapshot: { summary: "Bella can explain heat transfer.", strengths: ["Keywords"] },
  generatedAt: "2026-07-01T09:00:00",
  finalizedAt: "2026-07-02T10:00:00",
};

describe("progress report service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  it("uses the Tutor endpoint and bearer token for an owner report", async () => {
    localStorage.setItem("jwt_token", "tutor-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(report), { status: 200 }));

    await expect(fetchProgressReport(12, "TUTOR")).resolves.toEqual(report);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/tutor/reports/12",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tutor-token" }) }),
    );
  });

  it("uses the linked Student endpoint for a final recipient report", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(report), { status: 200 }));

    await fetchProgressReport(12, "STUDENT");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8083/api/learning/student/reports/12",
      expect.anything(),
    );
  });

  it("keeps a structured non-enumerating server failure available to the page", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ code: "REPORT_NOT_FOUND", message: "This progress report is not available." }), { status: 404 }));

    await expect(fetchProgressReport(12, "STUDENT")).rejects.toMatchObject({
      name: "ReportApiError",
      status: 404,
      message: "This progress report is not available.",
    } satisfies Partial<ReportApiError>);
  });

  it("rejects malformed or unsafe successful payloads", () => {
    expect(parseProgressReport(report)).toEqual(report);
    expect(() => parseProgressReport({ ...report, snapshot: [] })).toThrow("progress report response is invalid");
    expect(() => parseProgressReport({ ...report, status: "FINAL", finalizedAt: null })).toThrow("progress report response is invalid");
    expect(() => parseProgressReport({ ...report, periodEnd: "2026-01-01" })).toThrow("progress report response is invalid");
    expect(() => parseProgressReport({ ...report, studentId: 0 })).toThrow("progress report response is invalid");
  });
});
