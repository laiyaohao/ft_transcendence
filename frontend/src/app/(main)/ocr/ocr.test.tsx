import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "./page";
import { getBrowserSession } from "@/lib/auth";
import { fetchSubmissionDocument } from "@/services/submissions";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams("submissionId=55") }));
vi.mock("next/navigation", () => ({ useSearchParams: () => navigation.params }));
vi.mock("@/lib/auth", () => ({ getBrowserSession: vi.fn() }));
vi.mock("@/services/submissions", () => ({ correctOcrExtraction: vi.fn(), fetchSubmissionDocument: vi.fn(), SubmissionApiError: class SubmissionApiError extends Error {} }));
vi.mock("@/components/submissions/OcrReview", () => ({ default: () => <div>OCR pages</div> }));

describe("Student OCR review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBrowserSession).mockReturnValue({ token: "token", email: "student@example.test", role: "STUDENT", expiresAt: Date.now() + 60_000 });
    vi.mocked(fetchSubmissionDocument).mockResolvedValue({ id: 55, classId: null, studentId: 7, worksheetId: 42, uploadedByTutorId: null, status: "READY", createdAt: "2026-08-30T09:00:00", pages: [] });
  });

  it("renders the saved Student submission and returns to the Student worksheet library", async () => {
    render(<Page />);
    expect(await screen.findByText("Submission #55")).toBeVisible();
    expect(fetchSubmissionDocument).toHaveBeenCalledWith(55);
    expect(screen.getByRole("link", { name: "Return to My Worksheets" })).toHaveAttribute("href", "/worksheets");
  });
});
