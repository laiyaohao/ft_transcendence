import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPendingMarkingReviews, parsePendingMarkingReviews } from "./marking-reviews";

const review = { submissionId: 91, studentId: 7, studentName: "Bella Tan", worksheetId: 8, requestedAt: "2026-08-31T10:00:00" };

describe("pending marking reviews client", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });

  it("fetches and validates the tutor-scoped pending review queue", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([review]), { status: 200 }));

    await expect(fetchPendingMarkingReviews()).resolves.toEqual([review]);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/learning/tutor/marking-reviews"), expect.objectContaining({ headers: expect.any(Object) }));
  });

  it("rejects malformed review records", () => {
    expect(() => parsePendingMarkingReviews([{ submissionId: 91 }])).toThrow(/invalid/i);
  });
});
