import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SyllabusTree } from "@/services/syllabus";
import { WorksheetBuilder } from "./WorksheetBuilder";

const syllabus: SyllabusTree = { items: [{ id: 1, code: "SCI", name: "Science", nodeType: "SUBJECT", parentId: null, children: [{ id: 2, code: "SCI_P5", name: "Primary 5", nodeType: "LEVEL", parentId: 1, children: [{ id: 3, code: "SCI_P5_CYCLES", name: "Cycles", nodeType: "THEME", parentId: 2, children: [{ id: 4, code: "SCI_WATER", name: "Water", nodeType: "TOPIC", parentId: 3, children: [] }] }] }] }] };

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(await screen.findByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("WorksheetBuilder", () => {
  it("validates selected taxonomy topics, previews, then approves a draft", async () => {
    const user = userEvent.setup();
    const generate = vi.fn().mockResolvedValue({ id: 1, status: "SUCCEEDED", message: "Ready", worksheet: { id: 9, code: "GEN-9", title: "Water drill", instructions: null, targetMode: "CLASS", status: "DRAFT", dueAt: null, questions: [{ id: 2, code: "Q", prompt: "Explain evaporation.", totalMarks: 2, questionType: "OPEN_ENDED", topicName: "Water" }], assignments: [] } });
    const approve = vi.fn().mockResolvedValue({ id: 9, code: "GEN-9", title: "Water drill", instructions: null, targetMode: "CLASS", status: "APPROVED", dueAt: null, questions: [], assignments: [] });
    render(<WorksheetBuilder classId={1} generate={generate} approve={approve} loadSyllabus={async () => syllabus} loadQuestions={async () => ({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0, hasNext: false })} />);
    await user.click(screen.getByRole("button", { name: "Generate worksheet draft" }));
    expect(screen.getByRole("alert")).toBeVisible();
    await choose(user, "Subject", "Science"); await choose(user, "Level", "Primary 5"); await choose(user, "Theme", "Cycles"); await choose(user, "Topic", "Water");
    await user.click(screen.getByRole("button", { name: "Add selected topic" }));
    await user.click(screen.getByRole("button", { name: "Generate worksheet draft" }));
    expect(await screen.findByText("Explain evaporation.", { exact: false })).toBeVisible();
    expect(generate).toHaveBeenCalledWith(1, expect.objectContaining({ topicIds: [4] }), expect.any(String));
    await user.click(screen.getByRole("button", { name: "Approve & assign worksheet" }));
    expect(approve).toHaveBeenCalledWith(9, undefined);
  });

  it("requires selected students for a personalised draft and presents diagnostic evidence as a suggestion", async () => {
    const user = userEvent.setup();
    const diagnostic = vi.fn().mockResolvedValue({ status: "READY", message: "Evidence is ready.", recommendations: [{ studentId: 8, studentName: "Ari Tan", topicId: 4, topicName: "Water", masteryPercent: 42, attemptCount: 2, reason: "LOW_MASTERY" }] });
    render(<WorksheetBuilder classId={1} loadSyllabus={async () => syllabus} loadStudents={async () => [{ id: 8, tutorId: 1, fullName: "Ari Tan", loginUserId: null, classes: [], createdAt: "2026-01-01", updatedAt: "2026-01-01" }]} loadDiagnostic={diagnostic} />);

    await user.click(screen.getByRole("button", { name: /Selected students/ }));
    expect(await screen.findByLabelText("Ari Tan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Get diagnostic suggestions" }));
    expect(await screen.findByText(/Diagnostic recommendation/i)).toBeVisible();
    expect(screen.getByText(/Suggestion only — not saved or assigned/i)).toBeVisible();
    expect(diagnostic).toHaveBeenCalledWith(1);
  });

  it("uses validated profile context to open the individual worksheet flow with the student selected", async () => {
    const user = userEvent.setup();
    const generate = vi.fn().mockResolvedValue({ id: 1, status: "SUCCEEDED", message: "Ready", worksheet: { id: 9, code: "GEN-9", title: "Water drill", instructions: null, targetMode: "STUDENTS", status: "DRAFT", dueAt: null, questions: [{ id: 2, code: "Q", prompt: "Explain evaporation.", totalMarks: 2, questionType: "OPEN_ENDED", topicName: "Water" }], assignments: [] } });
    render(<WorksheetBuilder classId={1} initialStudentId={8} generate={generate} loadSyllabus={async () => syllabus} loadStudents={async () => [{ id: 8, tutorId: 1, fullName: "Ari Tan", loginUserId: null, classes: [], createdAt: "2026-01-01", updatedAt: "2026-01-01" }]} loadQuestions={async () => ({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0, hasNext: false })} />);

    expect(await screen.findByRole("checkbox", { name: "Ari Tan" })).toBeChecked();
    await choose(user, "Subject", "Science"); await choose(user, "Level", "Primary 5"); await choose(user, "Theme", "Cycles"); await choose(user, "Topic", "Water");
    await user.click(screen.getByRole("button", { name: "Add selected topic" }));
    await user.click(screen.getByRole("button", { name: "Generate worksheet draft" }));
    expect(generate).toHaveBeenCalledWith(1, expect.objectContaining({ targetMode: "STUDENTS", studentIds: [8] }), expect.any(String));
  });

  it("removes forged profile context when the student is not in the selected class", async () => {
    render(<WorksheetBuilder classId={1} initialStudentId={99} loadSyllabus={async () => syllabus} loadStudents={async () => [{ id: 8, tutorId: 1, fullName: "Ari Tan", loginUserId: null, classes: [], createdAt: "2026-01-01", updatedAt: "2026-01-01" }]} />);
    expect(await screen.findByText("This student is not an active member of the selected class.")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Ari Tan" })).not.toBeChecked();
  });

  it("saves keyboard-accessible reorder and removal changes through the draft update API", async () => {
    const user = userEvent.setup();
    const initial = { id: 11, code: "GEN-11", title: "Water drill", instructions: null, targetMode: "CLASS" as const, status: "DRAFT" as const, dueAt: null, questions: [
      { id: 2, code: "Q-2", prompt: "Explain evaporation.", totalMarks: 2, questionType: "OPEN_ENDED" as const, topicId: 4, topicName: "Water" },
      { id: 3, code: "Q-3", prompt: "Explain condensation.", totalMarks: 2, questionType: "OPEN_ENDED" as const, topicId: 4, topicName: "Water" },
    ], assignments: [] };
    const generate = vi.fn().mockResolvedValue({ id: 1, status: "SUCCEEDED", message: "Ready", worksheet: initial });
    const update = vi.fn().mockResolvedValue(initial);
    render(<WorksheetBuilder classId={1} generate={generate} update={update} loadSyllabus={async () => syllabus} loadQuestions={async () => ({ items: [{ id: 4, code: "Q-4", syllabusTopic: { id: 4, code: "SCI-WATER", name: "Water", nodeType: "SUBTOPIC" as const }, questionType: "OPEN_ENDED" as const, prompt: "Explain boiling.", totalMarks: 2, archiveState: "ACTIVE" as const }], page: 0, size: 100, totalElements: 1, totalPages: 1, hasNext: false })} />);
    await choose(user, "Subject", "Science"); await choose(user, "Level", "Primary 5"); await choose(user, "Theme", "Cycles"); await choose(user, "Topic", "Water");
    await user.click(screen.getByRole("button", { name: "Add selected topic" })); await user.click(screen.getByRole("button", { name: "Generate worksheet draft" }));
    await user.click(await screen.findByRole("button", { name: "Move question 2 up" }));
    expect(update).toHaveBeenCalledWith(11, expect.objectContaining({ questionIds: [3, 2] }));
  });
});
