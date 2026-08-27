import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionApiError, type QuestionMutationRequest, type TutorQuestion } from "@/services/questions";
import QuestionForm from "./QuestionForm";

const savedQuestion: TutorQuestion = {
  id: 7, code: "SCI-WATER-001", syllabusTopic: { id: 14, code: "SCI-WATER", name: "Water", nodeType: "SUBTOPIC" },
  questionType: "OPEN_ENDED", prompt: "Explain evaporation.", totalMarks: 2, modelAnswer: "Energy gain.", archiveState: "ACTIVE",
  markingComponents: [{ position: 0, description: "Explains energy", marks: 2 }], keywords: ["evaporation"],
  createdAt: "2026-08-27T08:00:00", updatedAt: "2026-08-27T08:00:00",
};

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Question code"), { target: { value: "sci-water-002" } });
  fireEvent.change(screen.getByLabelText("Syllabus topic ID"), { target: { value: "14" } });
  fireEvent.change(screen.getByLabelText("Question prompt"), { target: { value: "Explain condensation." } });
  fireEvent.change(screen.getByLabelText("Total marks"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Model answer"), { target: { value: "Cooling turns gas into liquid." } });
  fireEvent.change(screen.getByLabelText("Criterion 1"), { target: { value: "Explains cooling" } });
  fireEvent.change(screen.getByLabelText("Criterion 1 marks"), { target: { value: "2" } });
}

describe("QuestionForm", () => {
  it("validates a complete question and submits all marking metadata", async () => {
    const user = userEvent.setup();
    const submitQuestion = vi.fn().mockResolvedValue(savedQuestion);
    const onComplete = vi.fn();
    render(<QuestionForm mode="create" submitQuestion={submitQuestion} onComplete={onComplete} />);
    fillValidForm();
    await user.click(screen.getByRole("button", { name: "Create question" }));
    await waitFor(() => expect(submitQuestion).toHaveBeenCalledWith(expect.objectContaining({
      code: "sci-water-002", syllabusTopicId: 14, totalMarks: 2,
      markingComponents: [{ description: "Explains cooling", marks: 2 }],
    } satisfies Partial<QuestionMutationRequest>)));
    expect(onComplete).toHaveBeenCalledWith(savedQuestion);
  }, 15_000);

  it("stops required and unequal-mark submissions before calling the service", async () => {
    const user = userEvent.setup();
    const submitQuestion = vi.fn();
    render(<QuestionForm mode="create" submitQuestion={submitQuestion} onComplete={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create question" }));
    expect(screen.getByText("Question code is required.")).toBeVisible();
    expect(submitQuestion).not.toHaveBeenCalled();

    fillValidForm();
    await user.clear(screen.getByLabelText("Criterion 1 marks"));
    await user.type(screen.getByLabelText("Criterion 1 marks"), "1");
    await user.click(screen.getByRole("button", { name: "Create question" }));
    expect(screen.getByText("Criteria marks must exactly equal the total marks.")).toBeVisible();
    expect(submitQuestion).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Total marks"));
    await user.type(screen.getByLabelText("Total marks"), "2.001");
    await user.click(screen.getByRole("button", { name: "Create question" }));
    expect(screen.getByText("Enter marks greater than zero with up to two decimal places.")).toBeVisible();
  }, 15_000);

  it("renders server rejection fields and blocks a duplicate click while saving", async () => {
    const user = userEvent.setup();
    let resolve!: (question: TutorQuestion) => void;
    const submitQuestion = vi.fn(() => new Promise<TutorQuestion>((complete) => { resolve = complete; }));
    const firstForm = render(<QuestionForm mode="create" submitQuestion={submitQuestion} onComplete={vi.fn()} />);
    fillValidForm();
    await user.click(screen.getByRole("button", { name: "Create question" }));
    expect(screen.getByRole("button", { name: "Creating question…" })).toBeDisabled();
    expect(submitQuestion).toHaveBeenCalledTimes(1);
    resolve(savedQuestion);
    await waitFor(() => expect(screen.getByRole("button", { name: "Create question" })).toBeEnabled());
    firstForm.unmount();

    const rejected = vi.fn().mockRejectedValue(new QuestionApiError("This code is already in use.", 409, { code: "This code is already in use." }));
    render(<QuestionForm mode="create" submitQuestion={rejected} onComplete={vi.fn()} />);
    fillValidForm();
    await user.click(screen.getByRole("button", { name: "Create question" }));
    expect(await screen.findAllByText("This code is already in use.")).not.toHaveLength(0);
  }, 15_000);

  it("prepopulates an editable multi-component question", () => {
    render(<QuestionForm mode="edit" initialQuestion={{ ...savedQuestion, markingComponents: [...savedQuestion.markingComponents, { position: 1, description: "Uses scientific vocabulary", marks: 1 }], totalMarks: 3 }} submitQuestion={vi.fn()} onComplete={vi.fn()} />);
    expect(screen.getByLabelText("Question code")).toHaveValue("SCI-WATER-001");
    expect(screen.getByLabelText("Criterion 2")).toHaveValue("Uses scientific vocabulary");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
  });
});
