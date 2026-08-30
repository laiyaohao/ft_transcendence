import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "./page";
import { fetchSubmissionDocument, SubmissionApiError } from "@/services/submissions";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => navigation.params }));
vi.mock("@/services/submissions", async () => {
  const actual = await vi.importActual<typeof import("@/services/submissions")>("@/services/submissions");
  return { ...actual, fetchSubmissionDocument: vi.fn(), correctOcrExtraction: vi.fn() };
});

const document = {
  id: 51, classId: 3, studentId: 7, worksheetId: 42, uploadedByTutorId: 1,
  status: "READY" as const, createdAt: "2026-08-30T09:00:00",
  pages: [{ pageId: 8, extractionId: 9, text: "Water evaporates", confidence: .9, status: "READY" as const }],
};

describe("OCR submission handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams("submissionId=51");
    vi.mocked(fetchSubmissionDocument).mockResolvedValue(document);
  });

  it("loads OCR from the durable submission ID and renders its real context", async () => {
    render(<Page />);
    await waitFor(() => expect(fetchSubmissionDocument).toHaveBeenCalledWith(51));
    expect(await screen.findByText("Submission #51")).toBeVisible();
    expect(screen.getByText("Class #3 · Student #7 · Worksheet #42")).toBeVisible();
    expect(screen.getByDisplayValue("Water evaporates")).toBeVisible();
  });

  it("does not invent OCR context when the submission ID is missing", () => {
    navigation.params = new URLSearchParams();
    render(<Page />);
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a saved submission");
    expect(fetchSubmissionDocument).not.toHaveBeenCalled();
  });

  it("distinguishes an unavailable submission from a failed request", async () => {
    vi.mocked(fetchSubmissionDocument).mockRejectedValue(new SubmissionApiError("Submission document was not found.", 404));
    render(<Page />);
    expect(await screen.findByRole("alert")).toHaveTextContent("This submission was not found.");
  });
});
