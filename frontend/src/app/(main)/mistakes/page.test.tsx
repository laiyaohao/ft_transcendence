import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./page";
import { fetchMyMistakes } from "@/services/mistakes";

vi.mock("@/services/mistakes", () => ({ fetchMyMistakes: vi.fn() }));

const history = [
  { id: 1, worksheetId: 2, worksheetQuestionId: 3, questionBankId: 4, syllabusTopicId: 5, syllabusTopicCode: "SCI-5", mistakeType: "WRONG_UNITS" as const, mistakeLabel: "Wrong units", description: "The unit was omitted.", recordedAt: "2026-08-29T10:00:00" },
  { id: 2, worksheetId: 2, worksheetQuestionId: 4, questionBankId: 5, syllabusTopicId: 6, syllabusTopicCode: "SCI-6", mistakeType: "MISSING_KEY_POINT" as const, mistakeLabel: "Missing key point", description: "The required phrase was omitted.", recordedAt: "2026-08-28T10:00:00" },
];

describe("Mistakes page", () => {
  beforeEach(() => vi.mocked(fetchMyMistakes).mockReset());

  it("renders canonical records and filters by their Tutor-selected type", async () => {
    vi.mocked(fetchMyMistakes).mockResolvedValue(history);
    const user = userEvent.setup();
    render(<Page />);
    expect(await screen.findByText("The unit was omitted.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Wrong units" }));
    expect(screen.getByText("The unit was omitted.")).toBeInTheDocument();
    expect(screen.queryByText("The required phrase was omitted.")).not.toBeInTheDocument();
  });

  it("renders empty and recoverable error states", async () => {
    vi.mocked(fetchMyMistakes).mockResolvedValueOnce([]);
    const { unmount } = render(<Page />);
    expect(await screen.findByText("No confirmed mistakes yet")).toBeInTheDocument();
    unmount();
    vi.mocked(fetchMyMistakes).mockRejectedValueOnce(new Error("History is unavailable."));
    render(<Page />);
    expect(await screen.findByRole("alert")).toHaveTextContent("History is unavailable.");
  });
});
