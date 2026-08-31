import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const markingReviews = vi.hoisted(() => ({ fetchPendingMarkingReviews: vi.fn() }));

vi.mock("@/services/marking-reviews", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/marking-reviews")>();
  return { ...actual, fetchPendingMarkingReviews: markingReviews.fetchPendingMarkingReviews };
});

import TutorReviewsPage from "./page";

describe("TutorReviewsPage", () => {
  beforeEach(() => {
    markingReviews.fetchPendingMarkingReviews.mockResolvedValue([{ submissionId: 91, studentId: 2, studentName: "Tara Tan", worksheetId: 14, requestedAt: "2026-08-31T10:00:00" }]);
  });

  it("shows submitted worksheet reviews and opens the matching review", async () => {
    render(<TutorReviewsPage />);

    expect(await screen.findByRole("heading", { name: "Pending reviews" })).toBeVisible();
    expect(screen.getByText("Worksheet #14")).toBeVisible();
    expect(screen.getByText("Tara Tan")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open review" })).toHaveAttribute("href", "/tutor/reviews/91");
  });

  it("explains when there are no submitted worksheets to review", async () => {
    markingReviews.fetchPendingMarkingReviews.mockResolvedValueOnce([]);
    render(<TutorReviewsPage />);

    expect(await screen.findByRole("heading", { name: "No pending reviews" })).toBeVisible();
  });
});
