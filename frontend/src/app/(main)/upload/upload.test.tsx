import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "./page";
import { fetchTutorClasses } from "@/services/classes";
import { getBrowserSession } from "@/lib/auth";
import { fetchStudentSelfProfile, fetchTutorStudents } from "@/services/students";
import { createOcrDocument } from "@/services/submissions";
import { fetchStudentWorksheets, fetchSubmissionWorksheets, fetchTutorWorksheet, type StudentWorksheet, type TutorWorksheet } from "@/services/worksheets";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navigation.push }), useSearchParams: () => navigation.params }));
vi.mock("@/lib/auth", () => ({ getBrowserSession: vi.fn() }));
vi.mock("@/services/classes", () => ({ fetchTutorClasses: vi.fn() }));
vi.mock("@/services/students", () => ({ fetchTutorStudents: vi.fn(), fetchStudentSelfProfile: vi.fn() }));
vi.mock("@/services/worksheets", () => ({ fetchStudentWorksheets: vi.fn(), fetchSubmissionWorksheets: vi.fn(), fetchTutorWorksheet: vi.fn() }));
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
const assignedWorksheet: StudentWorksheet = { id: 42, code: "WS-42", title: "Water cycle practice", subjects: [{ id: 1, name: "Science" }], topics: [{ id: 2, name: "Water cycle" }], assignedAt: "2026-08-20T09:00:00", dueAt: null, status: "ASSIGNED", submittedAt: null, reviewedAt: null, score: null };
const studentProfile = { id: 7, fullName: "Bella Tan", classes: [], metrics: { averageMastery: null, topicCount: 0, totalAttempts: 0, lastCalculatedAt: null }, mastery: [], learningProfile: { strengths: [], focusAreas: [] }, history: [], worksheets: [], tutorOnly: null };

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: value }));
}

describe("Tutor upload wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams(); navigation.push.mockReset();
    vi.mocked(fetchTutorClasses).mockResolvedValue(classes);
    vi.mocked(fetchTutorStudents).mockImplementation(async (classId) => classId === 3 ? students : []);
    vi.mocked(fetchSubmissionWorksheets).mockResolvedValue([worksheet]);
    vi.mocked(fetchTutorWorksheet).mockResolvedValue(worksheet);
    vi.mocked(fetchStudentSelfProfile).mockResolvedValue(studentProfile);
    vi.mocked(fetchStudentWorksheets).mockResolvedValue([assignedWorksheet]);
    vi.mocked(getBrowserSession).mockReturnValue({ token: "token", email: "tutor@example.test", role: "TUTOR", expiresAt: Date.now() + 60_000 });
    vi.mocked(createOcrDocument).mockResolvedValue({ id: 1, classId: 3, studentId: 7, worksheetId: 42, uploadedByTutorId: 1, status: "READY", createdAt: "2026-08-30T09:00:00", pages: [] });
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

  it("persists every selected relationship then hands the saved submission to OCR", async () => {
    const user = userEvent.setup(); render(<Page />);
    await choose(user, "Class", "P6 Science A · Primary 6 Science");
    await choose(user, "Student", "Bella Tan");
    await choose(user, "Worksheet", "Water cycle practice");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    await user.upload(input, new File(["page"], "page.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: "Review submission" }));
    await user.click(screen.getByRole("button", { name: "Save and continue to OCR review" }));
    await waitFor(() => expect(createOcrDocument).toHaveBeenCalledWith(expect.objectContaining({ classId: 3, studentId: 7, worksheetId: 42 })));
    expect(navigation.push).toHaveBeenCalledWith("/ocr?submissionId=1");
  });

  it("does not allow a real selection to continue without at least one file", async () => {
    const user = userEvent.setup(); render(<Page />);
    await choose(user, "Class", "P6 Science A · Primary 6 Science");
    await choose(user, "Student", "Bella Tan");
    await choose(user, "Worksheet", "Water cycle practice");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Review submission" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Add at least one page");
    expect(createOcrDocument).not.toHaveBeenCalled();
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

describe("Student assigned worksheet upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams("ws=42"); navigation.push.mockReset();
    vi.mocked(getBrowserSession).mockReturnValue({ token: "token", email: "student@example.test", role: "STUDENT", expiresAt: Date.now() + 60_000 });
    vi.mocked(fetchStudentSelfProfile).mockResolvedValue(studentProfile);
    vi.mocked(fetchStudentWorksheets).mockResolvedValue([assignedWorksheet]);
    vi.mocked(createOcrDocument).mockResolvedValue({ id: 55, classId: null, studentId: 7, worksheetId: 42, uploadedByTutorId: null, status: "READY", createdAt: "2026-08-30T09:00:00", pages: [] });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:file"), revokeObjectURL: vi.fn() });
  });

  it("loads only the Student's assigned worksheet and never calls Tutor selection APIs", async () => {
    render(<Page />);
    expect(await screen.findByText("Worksheet: Water cycle practice")).toBeVisible();
    expect(fetchStudentSelfProfile).toHaveBeenCalledOnce();
    expect(fetchStudentWorksheets).toHaveBeenCalledWith({ status: "ASSIGNED" });
    expect(fetchTutorClasses).not.toHaveBeenCalled();
    expect(fetchTutorStudents).not.toHaveBeenCalled();
    expect(fetchSubmissionWorksheets).not.toHaveBeenCalled();
  });

  it("saves a Student-owned upload against the assigned worksheet then opens OCR review", async () => {
    const user = userEvent.setup(); render(<Page />);
    await screen.findByText("Student: Bella Tan");
    const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    await user.upload(input, new File(["page"], "page.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Save and continue to OCR review" }));
    await waitFor(() => expect(createOcrDocument).toHaveBeenCalledWith(expect.objectContaining({ studentId: 7, worksheetId: 42, pages: expect.any(Array) })));
    expect(createOcrDocument).toHaveBeenCalledWith(expect.not.objectContaining({ classId: expect.anything() }));
    expect(navigation.push).toHaveBeenCalledWith("/ocr?submissionId=55");
  });

  it("rejects a worksheet not currently assigned to the Student without offering a generic upload", async () => {
    vi.mocked(fetchStudentWorksheets).mockResolvedValue([]);
    render(<Page />);
    expect(await screen.findByRole("alert")).toHaveTextContent("not assigned to you");
    expect(screen.getByRole("link", { name: "Return to My Worksheets" })).toHaveAttribute("href", "/worksheets");
    expect(fetchTutorClasses).not.toHaveBeenCalled();
  });

  it("does not submit a Student worksheet without a real selected file", async () => {
    const user = userEvent.setup(); render(<Page />);
    await screen.findByText("Student: Bella Tan");
    expect(screen.getByRole("button", { name: "Save and continue to OCR review" })).toBeDisabled();
    expect(createOcrDocument).not.toHaveBeenCalled();
    await user.click(screen.getByRole("link", { name: "Cancel" }));
  });
});
