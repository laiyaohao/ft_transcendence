import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ManualResultForm from "./ManualResultForm";
import type { MarkingReview } from "@/services/submissions";
import type { TutorWorksheet } from "@/services/worksheets";

const worksheet: TutorWorksheet = {
  id: 3, code: "SCI-1", title: "Heat transfer", instructions: null, targetMode: "CLASS", status: "APPROVED", generationRequestId: null, dueAt: null,
  questions: [{ id: 5, code: "Q-1", prompt: "Why does metal feel hot?", totalMarks: 2, questionType: "SHORT_ANSWER", topicName: "Heat" }],
  assignments: [{ id: 1, assignmentType: "CLASS", classId: 7, studentProfileId: null, assignedAt: null, dueAt: null }],
};
const review: MarkingReview = { id: 10, studentId: 2, worksheetId: 3, worksheetQuestionId: 5, questionBankId: 5, extractedAnswer: "Metal conducts heat.", modelAnswer: "Metal conducts heat.", maxMarks: 2, aiSuggestedMarks: null, aiSuggestedOutcome: null, aiErrorCategory: null, missingKeywords: [], aiSuggestedFeedback: null, reviewStatus: "APPROVED", approvedMarks: 1.5, approvedFeedback: "Add heat-transfer detail.", reviewedByUserId: 1, reviewedAt: "2026-08-27T10:00:00", providerResponseValid: null, diagnosticEvidence: [], history: [{ id: 1, action: "APPROVED", reviewerUserId: 1, previousStatus: "PENDING_REVIEW", newStatus: "APPROVED", previousMarks: null, newMarks: 1.5, previousFeedback: null, newFeedback: "Add heat-transfer detail.", createdAt: "2026-08-27T10:00:00" }] };

async function select(label: string, option: RegExp, user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(screen.getByRole("option", { name: option }));
}

describe("ManualResultForm", () => {
  it("submits a valid partial score and invokes navigation with the approved review", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(review); const onCreated = vi.fn();
    render(<ManualResultForm worksheet={worksheet} students={[{ id: 2, fullName: "Ada Learner" }]} submit={submit} onCreated={onCreated} />);
    await select("Student", /Ada Learner/, user); await select("Worksheet question", /Q-1/, user);
    await user.type(screen.getByRole("textbox", { name: "Student answer or observation" }), "Metal conducts heat.");
    await user.type(screen.getByRole("spinbutton", { name: "Marks" }), "1.5");
    await user.type(screen.getByRole("textbox", { name: "Tutor feedback" }), "Add heat-transfer detail.");
    await user.click(screen.getByRole("button", { name: "Save approved result" }));
    expect(submit).toHaveBeenCalledWith({ worksheetId: 3, studentId: 2, questionBankId: 5, answer: "Metal conducts heat.", marks: 1.5, feedback: "Add heat-transfer detail." });
    expect(onCreated).toHaveBeenCalledWith(review);
  });

  it("blocks required and out-of-range values before submission", async () => {
    const user = userEvent.setup(); const submit = vi.fn();
    render(<ManualResultForm worksheet={worksheet} students={[{ id: 2, fullName: "Ada Learner" }]} submit={submit} />);
    await user.click(screen.getByRole("button", { name: "Save approved result" }));
    expect(await screen.findByText("Choose a student and question, then provide the answer, marks and feedback.")).toBeInTheDocument();
    await select("Student", /Ada Learner/, user); await select("Worksheet question", /Q-1/, user);
    await user.type(screen.getByRole("textbox", { name: "Student answer or observation" }), "Answer");
    await user.type(screen.getByRole("spinbutton", { name: "Marks" }), "3"); await user.type(screen.getByRole("textbox", { name: "Tutor feedback" }), "Feedback");
    await user.click(screen.getByRole("button", { name: "Save approved result" }));
    expect(await screen.findByText("Marks must be between 0 and 2.")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("prevents duplicate submits while loading and shows a server rejection", async () => {
    const user = userEvent.setup(); let reject!: (reason: Error) => void;
    const submit = vi.fn(() => new Promise<MarkingReview>((_, rejectPromise) => { reject = rejectPromise; }));
    render(<ManualResultForm worksheet={worksheet} students={[{ id: 2, fullName: "Ada Learner" }]} submit={submit} />);
    await select("Student", /Ada Learner/, user); await select("Worksheet question", /Q-1/, user);
    await user.type(screen.getByRole("textbox", { name: "Student answer or observation" }), "Answer"); await user.type(screen.getByRole("spinbutton", { name: "Marks" }), "1"); await user.type(screen.getByRole("textbox", { name: "Tutor feedback" }), "Feedback");
    await user.click(screen.getByRole("button", { name: "Save approved result" }));
    expect(screen.getByRole("button", { name: "Saving result…" })).toBeDisabled();
    expect(submit).toHaveBeenCalledTimes(1);
    reject(new Error("The manual result already exists."));
    expect(await screen.findByText("The manual result already exists.")).toBeInTheDocument();
  });

  it("explains when the worksheet is not ready for manual results", () => {
    render(<ManualResultForm worksheet={{ ...worksheet, status: "DRAFT" }} students={[{ id: 2, fullName: "Ada Learner" }]} />);
    expect(screen.getByText("Approve and assign this worksheet before entering results.")).toBeInTheDocument();
  });
});
