import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LearningProfile } from "@/services/insights";

vi.mock("@/services/insights", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/insights")>();
  return { ...actual, fetchLearningProfile: vi.fn() };
});

import SubjectProfilePage from "./page";
import { fetchLearningProfile } from "@/services/insights";

const profile: LearningProfile = { studentId: 31, dataAsOf: null, source: "DETERMINISTIC", strengths: [{ topicId: 1, topicName: "Water cycle", score: 90, status: "MASTERED", attemptCount: 3 }], growthAreas: [], findings: [] };

describe("SubjectProfilePage", () => {
  beforeEach(() => { vi.mocked(fetchLearningProfile).mockReset(); });

  it("renders canonical strengths rather than static subject mock data", async () => {
    vi.mocked(fetchLearningProfile).mockResolvedValue(profile);
    render(<SubjectProfilePage />);
    expect(await screen.findByText("Water cycle")).toBeVisible();
    expect(screen.getByText("90% mastery · 3 approved attempts")).toBeVisible();
  });

  it("keeps a failed profile request recoverable", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchLearningProfile).mockRejectedValueOnce(new Error("Service unavailable")).mockResolvedValueOnce(profile);
    render(<SubjectProfilePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Water cycle")).toBeVisible();
  });
});
