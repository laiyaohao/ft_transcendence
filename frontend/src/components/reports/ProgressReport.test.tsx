import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ProgressReport from "./ProgressReport";
import type { ProgressReport as ProgressReportData } from "@/services/reports";

const finalReport: ProgressReportData = {
  id: 12,
  studentId: 7,
  studentName: "Bella Tan",
  reportCode: "P5-SCI-T2",
  periodStart: "2026-04-01",
  periodEnd: "2026-06-30",
  status: "FINAL",
  snapshot: {
    summary: "Bella explains heat transfer using the required keywords.",
    strengths: ["Uses scientific vocabulary", "Explains insulation"],
    focusAreas: { topic: "Adaptation", evidence: "2 of 4 approved answers omitted survival advantage." },
  },
  generatedAt: "2026-07-01T09:00:00",
  finalizedAt: "2026-07-02T10:00:00",
};

describe("ProgressReport", () => {
  it("renders a final evidence snapshot as safe, readable text and exposes its immutable status", async () => {
    render(<ProgressReport reportId={12} viewerRole="TUTOR" loadReport={async () => finalReport} />);

    expect(await screen.findByRole("heading", { name: "Bella Tan's progress report" })).toBeVisible();
    expect(screen.getByLabelText("Report status: Final, immutable")).toHaveTextContent("FINAL · IMMUTABLE");
    expect(screen.getByText("Bella explains heat transfer using the required keywords.")).toBeVisible();
    expect(screen.getByText("Uses scientific vocabulary")).toBeVisible();
    expect(screen.getByText("2 of 4 approved answers omitted survival advantage.")).toBeVisible();
    expect(screen.getByText(/Later learning activity does not change/i)).toBeVisible();
    expect(screen.getByRole("link", { name: "Open student profile" })).toHaveAttribute("href", "/students/7");
    expect(screen.getByTestId("report-evidence-grid")).toBeVisible();
  });

  it("renders a tutor draft and keeps student-recipient navigation distinct", async () => {
    render(<ProgressReport reportId={12} viewerRole="TUTOR" loadReport={async () => ({ ...finalReport, status: "DRAFT", finalizedAt: null })} />);
    expect(await screen.findByLabelText("Report status: Draft, read only")).toHaveTextContent("DRAFT · READ ONLY");
    expect(screen.getByText(/has not been finalised for the student recipient/i)).toBeVisible();

    render(<ProgressReport reportId={12} viewerRole="STUDENT" loadReport={async () => finalReport} />);
    expect(await screen.findByRole("link", { name: "Back to my progress" })).toHaveAttribute("href", "/progress");
  });

  it("uses skeleton, empty, and retryable error states without trapping the user", async () => {
    let finish!: (value: ProgressReportData) => void;
    const { rerender } = render(<ProgressReport reportId={12} viewerRole="TUTOR" loadReport={() => new Promise<ProgressReportData>((resolve) => { finish = resolve; })} />);
    expect(screen.getByLabelText("Loading progress report")).toBeVisible();
    finish({ ...finalReport, snapshot: {} });
    expect(await screen.findByRole("heading", { name: "No evidence has been added" })).toBeVisible();

    const rejected = vi.fn().mockRejectedValueOnce(new Error("This progress report is not available.")).mockResolvedValue(finalReport);
    rerender(<ProgressReport reportId={12} viewerRole="TUTOR" loadReport={rejected} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("This progress report is not available.");
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(rejected).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Bella Tan's progress report" })).toBeVisible();
  });

  it("uses a responsive card grid and rejects an invalid report reference before requesting data", async () => {
    const load = vi.fn();
    const { container } = render(<ProgressReport reportId={0} viewerRole="TUTOR" loadReport={load} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("reference is invalid");
    expect(load).not.toHaveBeenCalled();
    expect(container.querySelector(".MuiGrid-root")).toBeNull();
  });

  it("renders snapshot text without treating it as markup", async () => {
    render(<ProgressReport reportId={12} viewerRole="TUTOR" loadReport={async () => ({ ...finalReport, snapshot: { evidence: "<img src=x onerror=alert(1)>" } })} />);
    expect(await screen.findByText("<img src=x onerror=alert(1)>")).toBeVisible();
    expect(document.querySelector("img")).toBeNull();
  });
});
