import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "./page";
import { fetchTutorClasses } from "@/services/classes";
import { fetchTutorStudents } from "@/services/students";
import { createOcrDocument } from "@/services/submissions";
import { fetchSubmissionWorksheets, fetchTutorWorksheet, type TutorWorksheet } from "@/services/worksheets";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navigation.push }), useSearchParams: () => navigation.params }));
vi.mock("@/services/classes", () => ({ fetchTutorClasses: vi.fn() }));
vi.mock("@/services/students", () => ({ fetchTutorStudents: vi.fn() }));
vi.mock("@/services/worksheets", () => ({ fetchSubmissionWorksheets: vi.fn(), fetchTutorWorksheet: vi.fn() }));
vi.mock("@/services/submissions", async () => {
  const actual = await vi.importActual<typeof import("@/services/submissions")>("@/services/submissions");
  return { ...actual, createOcrDocument: vi.fn() };
});

const classes = [
  { id: 3, tutorId: 1, className: "P6 Science A", subject: "Science", level: "Primary 6", status: "ACTIVE" as const, schedules: [] },
  { id: 4, tutorId: 1, className: "P6 Science B", subject: "Science", level: "Primary 6", status: "ACTIVE" as const, schedules: [] },
];
const students = [{ id: 7, tutorId: 1, loginUserId: 70, fullName: "Bella Tan", classes: [{ id: 3, className: "P6 Science A", subject: "Science", level: "Primary 6" }], createdAt: "2026-08-20T09:00:00", updatedAt: "2026-08-20T09:00:00" }];
const worksheet: TutorWorksheet = { id: 42, code: "WS-42", title: "Water cycle practice", instructions: null, subject: "Science", worksheetType: "STANDARD", targetMode: "CLASS", status: "APPROVED", generationRequestId: 9, sourceClassId: 3, dueAt: null, questions: [], assignments: [{ id: 1, assignmentType: "CLASS", classId: 3, studentProfileId: null, assignedAt: "2026-08-20T09:00:00", dueAt: null }] };

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: value }));
}

describe("Tutor upload wizard", () => {
  beforeEach(() => {
    navigation.params = new URLSearchParams(); navigation.push.mockReset();
    vi.mocked(fetchTutorClasses).mockResolvedValue(classes);
    vi.mocked(fetchTutorStudents).mockImplementation(async (classId) => classId === 3 ? students : []);
    vi.mocked(fetchSubmissionWorksheets).mockResolvedValue([worksheet]);
    vi.mocked(fetchTutorWorksheet).mockResolvedValue(worksheet);
    vi.mocked(createOcrDocument).mockResolvedValue({ documentId: 1, pages: [] });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:file"), revokeObjectURL: vi.fn() });
  });

  it("loads real tutor classes, class-filtered students, and server-filtered worksheets", async () => {
    const user = userEvent.setup(); render(<Page />);
    await choose(user, "Class", "P6 Science A · Primary 6 Science");
    await choose(user, "Student", "Bella Tan");
    await choose(user, "Worksheet", "Water cycle practice");
    expect(fetchTutorClasses).toHaveBeenCalledOnce();
    expect(fetchTutorStudents).toHaveBeenCalledWith(3);
    expect(fetchSubmissionWorksheets).toHaveBeenCalledWith(3, 7);
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("clears the student and worksheet when the class changes", async () => {
    const user = userEvent.setup(); render(<Page />);
    await choose(user, "Class", "P6 Science A · Primary 6 Science");
    await choose(user, "Student", "Bella Tan");
    await choose(user, "Worksheet", "Water cycle practice");
    await choose(user, "Class", "P6 Science B · Primary 6 Science");
    expect(fetchTutorStudents).toHaveBeenLastCalledWith(4);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("prefills student and class from the Student Profile route", async () => {
    navigation.params = new URLSearchParams("studentId=7&classId=3");
    render(<Page />);
    await waitFor(() => expect(fetchSubmissionWorksheets).toHaveBeenCalledWith(3, 7));
    expect(fetchTutorStudents).toHaveBeenCalledWith(3);
  });

  it("prefills worksheet and source class from the Worksheet route", async () => {
    navigation.params = new URLSearchParams("worksheetId=42&studentId=7");
    render(<Page />);
    await waitFor(() => expect(fetchSubmissionWorksheets).toHaveBeenCalledWith(3, 7));
    expect(fetchTutorWorksheet).toHaveBeenCalledWith(42);
    await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  });

  it("sends every selected relationship to OCR", async () => {
    const user = userEvent.setup(); render(<Page />);
    await choose(user, "Class", "P6 Science A · Primary 6 Science");
    await choose(user, "Student", "Bella Tan");
    await choose(user, "Worksheet", "Water cycle practice");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    await user.upload(input, new File(["page"], "page.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: "Review submission" }));
    await user.click(screen.getByRole("button", { name: "Submit for AI Marking" }));
    await waitFor(() => expect(createOcrDocument).toHaveBeenCalledWith(expect.objectContaining({ classId: 3, studentId: 7, worksheetId: 42 })));
  });

  it("shows a safe empty state when no worksheet is available for the selected relationship", async () => {
    vi.mocked(fetchSubmissionWorksheets).mockResolvedValue([]);
    const user = userEvent.setup(); render(<Page />);
    await choose(user, "Class", "P6 Science A · Primary 6 Science");
    await choose(user, "Student", "Bella Tan");
    expect(await screen.findByText("No worksheets available for this student/class.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
