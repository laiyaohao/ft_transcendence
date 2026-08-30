import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "./page";
import { createOcrDocument } from "@/services/submissions";
import { fetchStudentWorksheets, type StudentWorksheet } from "@/services/worksheets";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));
vi.mock("@/services/worksheets", () => ({ fetchStudentWorksheets: vi.fn() }));
vi.mock("@/services/submissions", async () => {
  const actual = await vi.importActual<typeof import("@/services/submissions")>("@/services/submissions");
  return { ...actual, createOcrDocument: vi.fn() };
});

const assignedWorksheet: StudentWorksheet = {
  id: 42,
  code: "WS-42",
  title: "Water cycle practice",
  subjects: [{ id: 3, name: "Science" }],
  topics: [{ id: 9, name: "Water cycle" }],
  assignedAt: "2026-08-20T09:00:00",
  dueAt: null,
  status: "ASSIGNED",
  submittedAt: null,
  reviewedAt: null,
  score: null,
};

describe("Upload wizard", () => {
  beforeEach(() => {
    navigation.params = new URLSearchParams("ws=42&studentId=7");
    navigation.push.mockReset();
    vi.mocked(fetchStudentWorksheets).mockResolvedValue([assignedWorksheet]);
    vi.mocked(createOcrDocument).mockResolvedValue({ documentId: 1, pages: [] });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:file"), revokeObjectURL: vi.fn() });
  });

  it("loads assigned API worksheets and requires pages before review", async () => {
    render(<Page />);

    await screen.findByRole("button", { name: /water cycle practice/i });
    expect(fetchStudentWorksheets).toHaveBeenCalledWith({ status: "ASSIGNED" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Review submission" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Add at least one page/);
    const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    await user.upload(input, new File(["page"], "page.jpg", { type: "image/jpeg" }));
    expect(screen.getByText("1 PAGE DETECTED")).toBeVisible();
    expect(document.querySelector('input[capture="environment"]')).toBeTruthy();
  });

  it("uses the canonical assigned worksheet ID when submitting OCR", async () => {
    render(<Page />);
    await screen.findByRole("button", { name: /water cycle practice/i });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    await user.upload(input, new File(["page"], "page.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: "Review submission" }));
    await user.click(screen.getByRole("button", { name: "Submit for AI Marking" }));

    await waitFor(() => expect(createOcrDocument).toHaveBeenCalledWith(expect.objectContaining({ studentId: 7, worksheetId: 42, pages: expect.any(Array) })));
  });

  it("does not submit an explicit worksheet ID that is not assigned to the Student", async () => {
    navigation.params = new URLSearchParams("ws=999&studentId=7");
    render(<Page />);

    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent(/not available for your account/i);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
