import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { QuestionBankFilters, QuestionBankPage } from "@/services/questions";
import QuestionList from "./QuestionList";

const firstPage: QuestionBankPage = {
  items: [{ id: 1, code: "SCI-WATER-001", syllabusTopic: { id: 14, code: "SCI-WATER", name: "Water", nodeType: "SUBTOPIC" }, questionType: "OPEN_ENDED", prompt: "Explain evaporation.", totalMarks: 2, archiveState: "ACTIVE" }],
  page: 0, size: 12, totalElements: 2, totalPages: 2, hasNext: true,
};
const secondPage: QuestionBankPage = {
  items: [{ id: 2, code: "SCI-ENERGY-001", syllabusTopic: { id: 16, code: "SCI-ENERGY", name: "Energy conversion", nodeType: "TOPIC" }, questionType: "MULTIPLE_CHOICE", prompt: "Choose the energy conversion.", totalMarks: 1, archiveState: "ACTIVE" }],
  page: 1, size: 12, totalElements: 2, totalPages: 2, hasNext: false,
};

describe("QuestionList", () => {
  it("shows loading before rendering question cards", async () => {
    let resolve!: (page: QuestionBankPage) => void;
    render(<QuestionList loadQuestions={() => new Promise<QuestionBankPage>((complete) => { resolve = complete; })} />);
    expect(screen.getByTestId("question-list-skeleton")).toBeVisible();
    await waitFor(() => expect(resolve).toBeTypeOf("function"));
    resolve(firstPage);
    expect(await screen.findByText("Explain evaporation.")).toBeVisible();
  });

  it("combines controls, resets pagination, and retains selected questions across pages", async () => {
    const user = userEvent.setup();
    const loadQuestions = vi.fn(async (filters: QuestionBankFilters) => filters.page === 1 ? secondPage : firstPage);
    render(<QuestionList loadQuestions={loadQuestions} />);
    await screen.findByText("Explain evaporation.");

    await user.click(screen.getByRole("checkbox", { name: "Select SCI-WATER-001" }));
    expect(screen.getByText("1 selected")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Choose the energy conversion.")).toBeVisible();
    expect(screen.getByText("1 selected")).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: "Select SCI-ENERGY-001" }));
    expect(screen.getByText("2 selected")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Open ended" }));
    await waitFor(() => expect(loadQuestions).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, questionType: "OPEN_ENDED" })));
    const topic = screen.getByLabelText("Syllabus topic ID");
    await user.type(topic, "14");
    await user.tab();
    await waitFor(() => expect(loadQuestions).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, topicId: 14, questionType: "OPEN_ENDED" })));
  });

  it("renders a responsive empty state and clears filters", async () => {
    const user = userEvent.setup();
    const loadQuestions = vi.fn().mockResolvedValue({ ...firstPage, items: [], totalElements: 0, totalPages: 0, hasNext: false });
    render(<QuestionList loadQuestions={loadQuestions} />);
    expect(await screen.findByRole("heading", { name: "No questions match these filters" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(loadQuestions).toHaveBeenCalledTimes(2);
  });

  it("shows a retryable service or invalid-payload error", async () => {
    const user = userEvent.setup();
    const loadQuestions = vi.fn().mockRejectedValueOnce(new Error("The learning service returned an invalid question page. Please try again.")).mockResolvedValueOnce(firstPage);
    render(<QuestionList loadQuestions={loadQuestions} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid question page");
    await user.click(screen.getByRole("button", { name: "Retry loading questions" }));
    expect(await screen.findByText("Explain evaporation.")).toBeVisible();
  });

  it("links each question to its detail page while keeping the edit shortcut", async () => {
    render(<QuestionList loadQuestions={async () => firstPage} />);
    expect(await screen.findByRole("link", { name: "View question" })).toHaveAttribute("href", "/questions/1");
    expect(screen.getByRole("link", { name: "Edit question" })).toHaveAttribute("href", "/questions/1/edit");
  });
});
