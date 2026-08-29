import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./page";
import { fetchTutorWorksheet, type TutorWorksheet } from "@/services/worksheets";

const navigation = vi.hoisted(() => ({ worksheetId: "7" }));
vi.mock("next/navigation", () => ({ useParams: () => navigation }));
vi.mock("@/services/worksheets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/worksheets")>();
  return { ...actual, fetchTutorWorksheet: vi.fn() };
});

const worksheet: TutorWorksheet = {
  id: 7, code: "WS-7", title: "Water practice", instructions: null, subject: "Science", worksheetType: "STANDARD",
  targetMode: "CLASS", status: "DRAFT", generationRequestId: 4, dueAt: null, assignments: [],
  questions: [{ id: 8, code: "Q-8", prompt: "Explain condensation.", questionType: "OPEN_ENDED", totalMarks: 2, topicId: 10, topicName: "Water" }],
};

describe("Tutor worksheet detail page", () => {
  beforeEach(() => { navigation.worksheetId = "7"; vi.mocked(fetchTutorWorksheet).mockReset(); });
  it("renders loading then the owner-scoped worksheet", async () => {
    let resolve: ((value: TutorWorksheet) => void) | undefined;
    vi.mocked(fetchTutorWorksheet).mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<Page />);
    expect(screen.getByTestId("tutor-worksheet-detail-skeleton")).toBeVisible();
    resolve?.(worksheet);
    expect(await screen.findByRole("heading", { name: "Water practice" })).toBeVisible();
  });
  it("renders missing/foreign access as a recoverable error and retries", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchTutorWorksheet).mockRejectedValueOnce(new Error("Worksheet resource was not found.")).mockResolvedValueOnce(worksheet);
    render(<Page />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Worksheet resource was not found.");
    await user.click(screen.getByRole("button", { name: "Retry loading worksheet" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Water practice" })).toBeVisible());
    expect(fetchTutorWorksheet).toHaveBeenCalledTimes(2);
  });
  it("rejects an invalid worksheet id before requesting the service", () => {
    navigation.worksheetId = "not-a-number";
    render(<Page />);
    expect(screen.getByRole("alert")).toHaveTextContent("worksheet reference is invalid");
    expect(fetchTutorWorksheet).not.toHaveBeenCalled();
  });
});
